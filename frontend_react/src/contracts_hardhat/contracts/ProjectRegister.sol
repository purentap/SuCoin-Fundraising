// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ProjectRegister{
    mapping (address => bool) public whitelist;
    mapping(bytes32 => election) public projectsRegistered;
    
    uint public whitelistedCount;
    uint public threshold;

    address public admin;

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
        admin = msg.sender;
        threshold = _threshold;
    }

    modifier onlyAdmin {
        require(admin == msg.sender, "Only admin");
        _;
    }

    modifier weightGiven(address voter, bytes32 fileHash){
        if(!projectsRegistered[fileHash].voters[voter].initialized){
            projectsRegistered[fileHash].voters[voter].weight = 1;
            projectsRegistered[fileHash].voters[voter].initialized = true;
        }
        _;
    }

    modifier onlyWhiteListed {
        require(whitelist[msg.sender], "User is not in whitelist");
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

    function addToWhiteList(address addrToAdd) public onlyAdmin{
        require(!whitelist[addrToAdd], "Address already in whitelist.");
        whitelist[addrToAdd] = true;
        whitelistedCount +=1;
        emit WhitelistInsert(addrToAdd);
    }

    function removeFromWhiteList(address addrToRemove) public onlyAdmin{
        require(whitelist[addrToRemove], "remove address not in whitelist.");
        whitelist[addrToRemove] = false;
        whitelistedCount -=1;
        emit WhitelistRemove(addrToRemove);
    }

    function changeAdmin(address addr) public onlyAdmin{
        require(addr != address(0), "address field zero address");
        admin = addr;
        emit AdminChange(msg.sender, addr);
    }

    function registerProject(bytes32 fileHash) public{
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