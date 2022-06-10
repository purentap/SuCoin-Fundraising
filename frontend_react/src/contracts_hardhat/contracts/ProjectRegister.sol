// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
/*
 ProjectRegister is the contract that handles and manages projects.
 Alongside with Maestro it manages the system
 These 2 contracts can be combined later on.

 ProjectRegister has
 -A Hashmap to manage permissions.
 -Voting system to approve and reject projects.
 -Registering or deleting projects
 -Hashmap for existing projects
 -Multisig systems for handling delicate things like deleting a project
 -Blacklist to prevent malicious users from creating projects
 -Whitelist to allow voting for project approval




*/

contract ProjectRegister is AccessControl{
    enum USER_STATUS {DEFAULT,WHITELISTED,BLACKLISTED,VIEWER}
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");


    mapping(bytes32 => election) public projectsRegistered;
    mapping (address => USER_STATUS) public statusList;




    //Used for multiSig
    struct addressCounterTimed {
        address[] addresses;
        uint beginningBlock;
    }



    mapping (bytes => addressCounterTimed) private multiSigCounter;
    
    uint public whitelistedCount;
    uint public threshold;


    struct Voter {
        uint weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        bool initialized;   // if initialized and weight assigned
        bool decision;
    }

    struct election{
        uint approved;
        uint rejected;
        address proposer;
        bool finalized;
        bool decision;
        mapping (address => Voter) voters;
    }

    event Register(
        address indexed from,
        bytes32 projectHash
    );

    event ProjectEvaluation(
        bytes32 indexed projectHash,
        bool isApproved
        
    );

    event Vote(
        bytes32 indexed project,
        address from,
        bool decision,
        uint weight
    );

    event VoteDelegate(
        address from,
        address to,
        bytes32 project,
        uint weight
    );

    event WhitelistInsert(
        address indexed user
    );

    event WhitelistRemove(
        address indexed user
    );

    event AdminChange(
        address from,
        address to
    );

    constructor(uint _threshold){
        _grantRole(DEFAULT_ADMIN_ROLE,msg.sender);
        _grantRole(ADMIN_ROLE,msg.sender);

       
        threshold = _threshold;
    }

    
    modifier multiSig(bytes32 role,uint walletCount,uint timeLimitInBlocks){
        //Check parameter correctness
        require(walletCount != 0,"Wallet Counter Parameter must be higher than 0");
        require(timeLimitInBlocks != 0, "Time limit must be higher than 0");
        //Check role permissions
        require(hasRole(role,address(0)) || hasRole(role,msg.sender),"You don't have permission to run this function");
        //Get reference to addresses
        addressCounterTimed storage addressCounter = multiSigCounter[msg.data];
        address[] storage addresses = addressCounter.addresses;

        

        //Initialize the timer if it isn't initialized
        if (addressCounter.beginningBlock == 0)
            addressCounter.beginningBlock = block.number;

        //If time limit is up reset
        else if (block.number - addressCounter.beginningBlock >= timeLimitInBlocks) 
            delete multiSigCounter[msg.data];
        

        //Check if user already signed
        for (uint i = 0; i < addresses.length; i++) 
            if (addresses[i] == address(msg.sender)) 
                revert("You can't sign twice, you need to wait other signers");
                
                
        //Add the new address
        addresses.push(msg.sender);
        
        //Only call the function if we have needed signature amount
        if (addresses.length == walletCount) {
            
            delete multiSigCounter[msg.data];
            _;
        }     
    }


 

    modifier weightGiven(address voter, bytes32 fileHash){
        if(!projectsRegistered[fileHash].voters[voter].initialized){
            projectsRegistered[fileHash].voters[voter].weight = 1;
            projectsRegistered[fileHash].voters[voter].initialized = true;
        }
        _;
    }


    modifier onlyWhiteListed  {
        require(statusList[msg.sender] == USER_STATUS.WHITELISTED, "User is not in whitelist");
        _;
    }

     modifier notBlackListed  {
        require(statusList[msg.sender] != USER_STATUS.BLACKLISTED, "User is in blacklist");
        _;
    }


    modifier projectExists(bytes32 fileHash) {
        require(projectsRegistered[fileHash].proposer != address(0), "Project does not exist"); 
        _;
    }

    modifier notVoted(bytes32 fileHash) {
        require(!projectsRegistered[fileHash].voters[msg.sender].voted, "User already voted");
        _;
    }


    //Changes non renounceable roles
    //Only admin can change roles   

    function editUserStatus(address user, USER_STATUS newStatus) onlyRole(ADMIN_ROLE) public {
            USER_STATUS currentStatus = statusList[user];
            require(newStatus != currentStatus,"User already has this status");
            //Handles whitelist count change if whitelist is added or removed
            whitelistedCount = whitelistedCount +  uint(newStatus) % 2  - uint(currentStatus) % 2;
            statusList[user] = newStatus;

    }

    //Removes an existing project
    //Can only be done by multiple admins
    ///!!! This could be dangerous for now
    //todo voting is broken if removed project added and voted later
    function removeProject(bytes32 fileHash) public multiSig(ADMIN_ROLE,2,100)  {
        require(projectsRegistered[fileHash].proposer != address(0), "Project Does not exist!!!");
        delete projectsRegistered[fileHash];
    }
 
    //Registers a project if it doesn't exist and user is not blacklisted
    function registerProject(bytes32 fileHash) public notBlackListed{
        require(projectsRegistered[fileHash].proposer == address(0), "Project Already Exists!!!");
        projectsRegistered[fileHash].proposer = msg.sender;
        emit Register(msg.sender, fileHash);
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param fileHash a parameter just like in doxygen (must be followed by parameter name)=
    function voteProposal(bytes32 fileHash, bool decision) public onlyWhiteListed projectExists(fileHash) notVoted(fileHash) weightGiven(msg.sender, fileHash){
        require(!projectsRegistered[fileHash].finalized, "This proposal already come to a decision.");
        uint weight = projectsRegistered[fileHash].voters[msg.sender].weight;
        projectsRegistered[fileHash].voters[msg.sender].weight = 0;
        projectsRegistered[fileHash].voters[msg.sender].voted = true;
        projectsRegistered[fileHash].voters[msg.sender].decision = decision;
        if (decision){
            projectsRegistered[fileHash].approved += weight;
        }else{
            projectsRegistered[fileHash].rejected += weight;
        }
        emit Vote(fileHash, msg.sender, decision, weight);
        if(projectsRegistered[fileHash].approved > whitelistedCount*threshold/100 || projectsRegistered[fileHash].rejected > whitelistedCount*threshold/100){
            evaluatePendingProjectStatus(fileHash);
        }
    }

    function evaluatePendingProjectStatus(bytes32 fileHash) private{
        //console.log("Approve count: %s, Reject count: %s", projectsRegistered[fileHash].approved, projectsRegistered[fileHash].rejected);
        if (projectsRegistered[fileHash].approved > projectsRegistered[fileHash].rejected) {
            projectsRegistered[fileHash].decision  = true;
        }
        projectsRegistered[fileHash].finalized  = true;
        emit ProjectEvaluation(fileHash, projectsRegistered[fileHash].decision);
    }

    /**
    * @dev Delegate your vote to the voter 'to'.
    * @param to address to which vote is delegated
    */
    function delegate(address to, bytes32 fileHash) public onlyWhiteListed notVoted(fileHash) weightGiven(msg.sender, fileHash) weightGiven(to, fileHash){
        Voter storage sender = projectsRegistered[fileHash].voters[msg.sender];
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (projectsRegistered[fileHash].voters[to].delegate != address(0)) {
            to = projectsRegistered[fileHash].voters[to].delegate;

            // We found a loop in the delegation, not allowed.
            require(to != msg.sender, "Found loop in delegation.");
        }
        sender.voted = true;
        sender.delegate = to;
        Voter storage delegate_ = projectsRegistered[fileHash].voters[to];
        if (delegate_.voted) {
            // If the delegate already voted,
            // directly add to the number of votes
            delegate_.decision ? (projectsRegistered[fileHash].approved += sender.weight) : (projectsRegistered[fileHash].rejected += sender.weight);
        } else {
            // If the delegate did not vote yet,
            // add to her weight.
            delegate_.weight += sender.weight;
        }
        emit VoteDelegate(msg.sender, to, fileHash, sender.weight);
        if(projectsRegistered[fileHash].approved > whitelistedCount*threshold/100 || projectsRegistered[fileHash].rejected > whitelistedCount*threshold/100){
            evaluatePendingProjectStatus(fileHash);
        }
    }

    function isValidToDistribute(address addr, bytes32 fileHash) external view returns(bool){
        require(projectsRegistered[fileHash].proposer == addr, "Proposer address does not match!");
        require(projectsRegistered[fileHash].finalized, "Project voting hasnt finished");
        require(projectsRegistered[fileHash].decision, "Project rejected");
        return true;
    }
}