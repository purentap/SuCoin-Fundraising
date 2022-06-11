// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;


import "@openzeppelin/contracts/proxy/Clones.sol";

import "./UpgradeableAuctions/Auction.sol";

import "./UpgradeableTokens/ERC20MintableBurnableUpgradeable.sol";

import "./ProjectRegister.sol";


/*
 Maestro is the contract that handles auctions and token management.
 Alongside with ProjectRegister it manages the system
 These 2 contracts can be combined later on.
 New Auctions and tokens are created using minimal proxies (clones)
 as this way you only need to deploy actual auction contracts once 
 so it is cheaper to create new tokens and auctions from them

 Maestro also has functions for admins like changing sucoin address or pausing an auction
 Some of those functions are  important security wise so they are using 
 multisig (more than one admin is needed to actually execute the function)
 to ensure one admin does not destroy the whole system

 Maestro also has function to get auction info to be used on frontend 

*/

contract Maestro {


    mapping (bytes32 => Project) public projectTokens;

    address tokenImplementationAddress;
    mapping (string => address) private auctionNameAddressSet;

    mapping (bytes => ProjectRegister.addressCounterTimed) private multiSigCounter;



    ERC20 sucoin;




    ProjectRegister projectManager;

    struct Project{
        address proposer;
        address token;
        address auction;
        string auctionType;
    }


    //Has the information to be used on auction frontend page
    struct ProjectSurface {
        address auction;
        string tokenName;
        string tokenSymbol;
        string auctionType;
        bytes32 projectHash;

    }



  struct userAuctionParameters {

       uint numberOfTokensToBeDistributed;
       uint rate;
       uint finalRate;
       uint limit;
    }


    //Gets count amount of auctions with having the Auction status of status
    //Gets a hash list (likely from database) to not store auction array in contract
    //Which also enables getting auctions only created from the website
    //Ignore parameter is used if you want to get all auctions instead 
    //Used to create a more dynamic auction page for frontend
    function getProjectSurfaceByStatus(bytes32[] calldata hashes,Auction.AuctionStatus status,uint selectCount,bool ignore) view public returns(ProjectSurface[] memory){

      if (selectCount > hashes.length)
            selectCount = hashes.length;

        ProjectSurface[] memory wantedProjects = new ProjectSurface[](selectCount);


        for (uint i = 0; (i < hashes.length) && (selectCount > 0); i++) {
               Project  storage  project = projectTokens[hashes[i]];
               address auction = project.auction;

               if (auction == address(0))
                continue;

               if (ignore || Auction(auction).getStatus() == status) {
                   ERC20 token = ERC20(project.token);
                   wantedProjects[--selectCount] = ProjectSurface(project.auction,token.name(),token.symbol(),project.auctionType,hashes[i]);
               }
               
            }
        return wantedProjects;

        }


        function getAllAuctionsByHashList(bytes32[] calldata hashes) view external returns(ProjectSurface[] memory){
            return getProjectSurfaceByStatus(hashes,Auction.AuctionStatus.OFF,hashes.length,true);  // ignore status
        }
                

                


    //Constructor of the contract
    //Maestro contract should be deployed after sucoin, projectRegister and auction implementation contracts
    //Because maestro contract is using information from those contracts

    //Name array includes types of auction implementations whiile implementationContracts includes addreses of those implementations
    //Those two array should be the same length and in same order
    //It is hard to call the constructor manually so you can use the deployer script from the frontend (if it is implementated by the time you see this)
   
    constructor(address _sucoin,address _projectManager,string[] memory nameArray,address[] memory implementationContracts){

        

        sucoin = ERC20(_sucoin);

        uint wantedLength = nameArray.length;

        require(implementationContracts.length == wantedLength,"Wrong input format name and address counts don't match");

        for(uint i = 0; i < wantedLength; i++) {
            auctionNameAddressSet[nameArray[i]] = implementationContracts[i];
        }

        tokenImplementationAddress = address(new ERC20MintableBurnableUpgradeable());

        projectManager = ProjectRegister(_projectManager); 
        
    }
    
    event TokenCreation(
        address indexed creator,
        string Name,
        string Symbol,
        address indexed token
    );

    event CreateAuctionEvent(
        address indexed creator,
        address auction,
        string auctionType,
        bytes32 fileHash
    );



//Multisig is a modifier that makes a function only be executed when it is called by a certain number of accounts having a specific role
modifier multiSig(bytes32 role,uint walletCount,uint timeLimitInBlocks){
        //Check parameter correctness
        require(walletCount != 0,"Wallet Counter Parameter must be higher than 0");
        require(timeLimitInBlocks != 0, "Time limit must be higher than 0");
        //Check role permissions
        require(projectManager.hasRole(role,address(0)) || projectManager.hasRole(role,msg.sender),"You don't have permission to run this function");
        //Get reference to addresses
        ProjectRegister.addressCounterTimed storage addressCounter = multiSigCounter[msg.data];
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



    function setSucoin(address newAddress) external multiSig(projectManager.ADMIN_ROLE(),2,100) {
        sucoin = ERC20(newAddress);
    }


    modifier tokenAssigned(bytes32 projectHash){
        require(projectTokens[projectHash].token != address(0),"No token assigned to this project");
        _;
    }

    

    modifier notDeployed(bytes32 projectHash){
        require(projectTokens[projectHash].auction == address(0),"Auction already deployed for this project.");
        _;
    }

  


   modifier tokenOwner(bytes32 projectHash, address owner){
        require(projectTokens[projectHash].proposer == owner ,"You are not the owner of the token");
        _;
    }


    modifier managerControl(bytes32 projectHash,address caller) {
        projectManager.isValidToDistribute(caller,projectHash);
        _;
    }



    //This functions can be used to pause an existing and started auction for a certain amount of time
    //This is useful for emergency situations
    //The function is using multisig if admin count is needed to be changed
    //Sign time also can be changed if needed
    function pauseAuction(bytes32 projectHash,uint pauseTimeInHours) external multiSig(projectManager.ADMIN_ROLE(),1,1) {         //Admin count / sign time can change
        address auction = projectTokens[projectHash].auction;
        require(auction != address(0),"There are no auctions for this project");
        Auction auctionContract = Auction(auction);
        auctionContract.pauseAuction(pauseTimeInHours);
        //Check conditions are done in the auction contract (already finished or already paused)

    }

    function forceFinishAuction(bytes32 projectHash) external multiSig(projectManager.ADMIN_ROLE(),1,1) {         //Admin count / sign time can change
        address auction = projectTokens[projectHash].auction;
        require(auction != address(0),"There are no auctions for this project");
        Auction auctionContract = Auction(auction);
        auctionContract.forcedManualFinish();

    }


    //CreateAuction creates a new proxy auction contract for a project
    //Also gives the proposer permission for the auction to the caller
    //Can only be called by the project owner and after the token is assigned
    function createAuction(
        bytes32 projectHash,
        string memory auctionType,
        userAuctionParameters calldata userParams
        ) external notDeployed(projectHash) tokenAssigned(projectHash)  managerControl(projectHash,msg.sender)    {

       
        address auctionImplementationAddress = getNonzeroElement(auctionNameAddressSet,auctionType);

        //params.token = projectTokens[projectHash].token;


        //Create proxy of auction
        Auction clone =  Auction(Clones.clone(auctionImplementationAddress));

        //Sets the parameters fror auctions
        //Used this way  instead of seperate arguments because of parameter limit on solidity
        Auction.auctionParameters memory aucParams = Auction.auctionParameters({
            token: projectTokens[projectHash].token,
            bidCoin: address(sucoin),
            limit: userParams.limit,
            numberOfTokensToBeDistributed : userParams.numberOfTokensToBeDistributed,
            finalRate: userParams.finalRate,
            rate:userParams.rate
        });

        //Initialize the proxy and give user proposer permission

        clone.initialize(aucParams);

        //Permision of being a proposer and adding other proposers
        clone.grantRole(clone.PROPOSER_ADMIN_ROLE(), msg.sender);
        clone.grantRole(clone.PROPOSER_ROLE(), msg.sender);

        //Where the collected sucoins will go
        clone.setTeamWallet(msg.sender);


        //Handle Auction Token Amaount

        ERC20MintableBurnableUpgradeable tokenContract = ERC20MintableBurnableUpgradeable(projectTokens[projectHash].token);

        if (userParams.numberOfTokensToBeDistributed != 0) //Capped Auction
            tokenContract.mint(address(clone),userParams.numberOfTokensToBeDistributed);   
        else                                               //Uncapped Auction
            tokenContract.grantRole(keccak256("MINTER_ROLE"),address(clone));

               
        projectTokens[projectHash].auction = address(clone);
        projectTokens[projectHash].auctionType = auctionType;


        emit CreateAuctionEvent(msg.sender, address(clone), auctionType, projectHash);


    }



    //Creates token for the project which will be later used for auction
    //Token is created using ERC20MintableBurnableUpgradeable which allows for mints and burns
    //But that permissions are not given to project proposer so that he can't mint or burn
    //They are used to mint or burn tokens for auction contract itself and permissions are renounced after auction is finished
    
    //Manager control is used to check if the project is already created and approved and creater of token and project is the same
    function createToken(bytes32 projectHash, string memory tokenName, string memory tokenSymbol , uint initialSupply) public  managerControl(projectHash,msg.sender)   returns (address){    //Currently multiple tokens for a project can't be created

        //Currently multiple tokens for a project can't be created
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");


        //Create proxy of token
        ERC20MintableBurnableUpgradeable clone =  ERC20MintableBurnableUpgradeable(Clones.clone(tokenImplementationAddress));

        //Initialize the proxy 
        clone.initialize(tokenName,tokenSymbol,initialSupply);

        //Transfer all the tokens  minted to the project proposer (when auction is created new ones will be minted for the auction)
        clone.transfer(msg.sender,clone.totalSupply());
        

        //Set the token and proposer
        projectTokens[projectHash].token = address(clone);
        projectTokens[projectHash].proposer = msg.sender;

        emit TokenCreation(msg.sender, clone.name(), clone.symbol(),address(clone));
        return address(clone);

    }

    //Helpr for getting implementation contracts
    function getNonzeroElement(mapping (string => address) storage map,string memory index) internal view returns  (address){

        address typeAddress = map[index];
        require(typeAddress != address(0),"This type does not exist");
        return typeAddress;
    }

    //Edit implementation makes it possible to change how an auction contract works without redeploying the whole maestro contract
    //If you want to change the implementation of FCFSAuction you need to deploy a new FCFSAuction Contract then call this function
    //With the name FCFSAuction and the new address of the FCFSAuction Contract
    //From now on you can call createAuction with the name FCFSAuction and the new version of the FCFSAuction Contract will be used
    //Needs at least two admins for security reasons
    function editImplementation(string memory name, address newImplementationAddress) external multiSig(projectManager.ADMIN_ROLE(),2,100)  {
        address addressCurrent = auctionNameAddressSet[name];
        require(addressCurrent != address(0),"This contract type is not specified");
        auctionNameAddressSet[name] = newImplementationAddress;
    }


}