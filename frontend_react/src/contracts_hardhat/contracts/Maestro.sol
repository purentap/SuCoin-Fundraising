// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
import "contracts/ProjectRegister.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Maestro {
    mapping (bytes32 => Project) public projectTokens;

    address admin;

    ProjectRegister projectManager;

    struct Project{
        address proposer;
        address token;
        address auction;
    }

    constructor(address _projectManager){
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

    function assignToken(address tokenaddr, bytes32 projectHash) public {
        require(tokenaddr != address(0), "Empty parameter tokenaddr");
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");
        projectManager.isValidToDistribute(msg.sender, projectHash);
        projectTokens[projectHash].token = tokenaddr;
        projectTokens[projectHash].proposer = msg.sender;
        ERC20 token = ERC20(tokenaddr);
        emit TokenCreation(msg.sender, token.name(), token.symbol(),address(token));
    }   

    function AssignAuction(address owner, bytes32 projectHash, address tokenAddress, string memory aucType) public tokenAssigned(projectHash) tokenOwner(projectHash, owner) notDeployed(projectHash) returns(bool){
        require(projectTokens[projectHash].token == tokenAddress);
        projectTokens[projectHash].auction = msg.sender;
        emit CreateAuctionEvent(owner, msg.sender, aucType, projectHash);
        return true;
    }
}