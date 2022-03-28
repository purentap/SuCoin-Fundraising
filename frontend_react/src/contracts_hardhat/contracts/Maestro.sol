// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
import "contracts/ProjectRegister.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Maestro is Ownable{
    mapping (bytes32 => Project) public projectTokens;
    mapping (bytes32 => string) public whiteListedContracts;

    address admin;

    EnumerableSet.AddressSet private mySet;


    ProjectRegister projectManager;

    struct Project{
        address proposer;
        address token;
        address auction;
    }

        function  addAuctionTypeToWhitelist(bytes32 bytecodeHash,string memory auctionType) public onlyOwner() {
        require(bytes(auctionType).length > 0,"You can't enter an empty type");
        whiteListedContracts[bytecodeHash] = auctionType;
        emit whiteListAuctionAdd(bytecodeHash, auctionType);
    }   

     function  removeAuctionTypeFromWhitelist(bytes32 bytecodeHash) external onlyOwner() {
         string memory aucType = whiteListedContracts[bytecodeHash];
         require(bytes(aucType).length > 0 , "This auction type is already not whitelisted");
         whiteListedContracts[bytecodeHash] = "";
         emit whiteListAuctionRemove(bytecodeHash,aucType);
    }   


    constructor(address _projectManager,bytes32[] memory byteHashes,string[] memory names){

        require(byteHashes.length == names.length);
        for (uint i = 0; i < byteHashes.length; i++) {
            addAuctionTypeToWhitelist(byteHashes[i],names[i]);
        }
       

        admin = msg.sender;
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

    event whiteListAuctionAdd(
        bytes32 auctionHash,
        string auctionType
    );

    event whiteListAuctionRemove(
        bytes32 auctionHash,
        string auctionType
    );

    modifier tokenAssigned(bytes32 projectHash){
        require(projectTokens[projectHash].token != address(0),"No token assigned to this project");
        _;
    }

    modifier tokenOwner(bytes32 projectHash, address owner){
        require(projectTokens[projectHash].proposer == owner ,"You are not the owner of the token");
        _;
    }

    modifier notDeployed(bytes32 projectHash){
        require(projectTokens[projectHash].auction == address(0),"Auction already deployed for this project.");
        _;
    }

    modifier owned(address auctionAddress,address ownerAddress) {
        require(Ownable(auctionAddress).owner() == ownerAddress);
        _;
    }

    function assignToken(address tokenaddr, bytes32 projectHash) public {
        require(tokenaddr != address(0), "Empty parameter tokenaddr");
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");
        projectManager.isValidToDistribute(msg.sender, projectHash);
        projectTokens[projectHash].token = tokenaddr;
        projectTokens[projectHash].proposer = msg.sender;
        ERC20 token = ERC20(tokenaddr);
        emit TokenCreation(msg.sender, token.name(), token.symbol(),address(token));
    }



    function AssignAuction(address auctionAddress, bytes32 projectHash, address tokenAddress) public tokenAssigned(projectHash) tokenOwner(projectHash, msg.sender) notDeployed(projectHash) owned(auctionAddress,msg.sender) returns(bool){
        
     
        require(projectTokens[projectHash].token == tokenAddress);

        //Whitelisted contracts take hash of bytecode and maps to name of the auction type
        string memory projectName = whiteListedContracts[keccak256(auctionAddress.code)];

    
        //Empty string => not whitelisted
        require(bytes(projectName).length > 0,"This project type is not whitelisted");
 

        //Checks passed
        projectTokens[projectHash].auction = auctionAddress;
        emit CreateAuctionEvent(auctionAddress, msg.sender, projectName, projectHash);
        return true;
    }
}