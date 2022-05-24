// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;


import "@openzeppelin/contracts/proxy/Clones.sol";

import "./UpgradeableAuctions/Auction.sol";

import "./UpgradeableTokens/ERC20MintableBurnableUpgradeable.sol";

import "./ProjectRegister.sol";


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



    function getProjectSurfaceByStatus(bytes32[] calldata hashes,Auction.AuctionStatus status,uint selectCount) view external returns(ProjectSurface[] memory){


        ProjectSurface[] memory wantedProjects = new ProjectSurface[](selectCount);


        for (uint i = 0; (i < hashes.length) && (selectCount > 0); i++) {
               Project  storage  project = projectTokens[hashes[i]];
               address auction = project.auction;

               if (auction == address(0))
                continue;

               if (Auction(auction).status() == status) {
                   ERC20 token = ERC20(project.token);
                   wantedProjects[--selectCount] = ProjectSurface(project.auction,token.name(),token.symbol(),project.auctionType,hashes[i]);
               }
               
            }
        return wantedProjects;

        }
                

                


    
   
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



    
    function pauseAuction(bytes32 projectHash,uint pauseTimeInHours) external multiSig(projectManager.ADMIN_ROLE(),1,1) {         //Admin count / sign time can change
        address auction = projectTokens[projectHash].auction;
        require(auction != address(0),"There are no auctions for this project");
        Auction auctionContract = Auction(auction);
        auctionContract.pauseAuction(pauseTimeInHours);
        //Check conditions are done in the auction contract (already finished or already paused)

    }


    function createAuction(
        bytes32 projectHash,
        string memory auctionType,
        userAuctionParameters calldata userParams
        ) external notDeployed(projectHash) tokenAssigned(projectHash)  managerControl(projectHash,msg.sender)    {

       
        address auctionImplementationAddress = getNonzeroElement(auctionNameAddressSet,auctionType);

        //params.token = projectTokens[projectHash].token;


        //Create proxy of auction
        Auction clone =  Auction(Clones.clone(auctionImplementationAddress));

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

        //Where the collected sucıins will go
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


    function createToken(bytes32 projectHash, string memory tokenName, string memory tokenSymbol , uint initialSupply) public  managerControl(projectHash,msg.sender)   returns (address){
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");



        ERC20MintableBurnableUpgradeable clone =  ERC20MintableBurnableUpgradeable(Clones.clone(tokenImplementationAddress));

        clone.initialize(tokenName,tokenSymbol,initialSupply);

        clone.transfer(msg.sender,clone.totalSupply());
        


        projectTokens[projectHash].token = address(clone);
        projectTokens[projectHash].proposer = msg.sender;

        emit TokenCreation(msg.sender, clone.name(), clone.symbol(),address(clone));
        return address(clone);

    }

    function getNonzeroElement(mapping (string => address) storage map,string memory index) internal view returns  (address){

        address typeAddress = map[index];
        require(typeAddress != address(0),"This type does not exist");
        return typeAddress;
    }

    //TODO: MULTISIG need 2 admins
    function editImplementation(string memory name, address newImplementationAddress) external multiSig(projectManager.ADMIN_ROLE(),2,100)  {
        address addressCurrent = auctionNameAddressSet[name];
        require(addressCurrent != address(0),"This contract type is not specified");
        auctionNameAddressSet[name] = newImplementationAddress;
    }


}