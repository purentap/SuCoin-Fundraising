// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
import "contracts/ProjectRegister.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "contracts/UpgradeableTokens/Erc20MintableUpgradeable.sol";
import "contracts/UpgradeableTokens/Erc20TokenUpgradeable.sol";

import "@openzeppelin/contracts/proxy/Clones.sol";



contract Maestro is Ownable{
    mapping (bytes32 => Project) public projectTokens;

    mapping (string => address) private nameAddressSet;

    

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

        nameAddressSet["Erc20TokenUpgradeable"] = address(new ERC20TokenUpgradeable());
        nameAddressSet["ERC20MintableUpgradeable"] = address(new ERC20MintableUpgradeable());

    



        
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

    

    modifier notDeployed(bytes32 projectHash){
        require(projectTokens[projectHash].auction == address(0),"Auction already deployed for this project.");
        _;
    }


    function createToken(bytes32 projectHash, string memory tokenName, string memory tokenSymbol , uint totalSupply) public returns(uint) {
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");
        projectManager.isValidToDistribute(msg.sender, projectHash);



        ERC20Upgradeable token;
        address clone;


        if(totalSupply > 0) {
            address tokenImplementationAddress = nameAddressSet["Erc20TokenUpgradeable"];
            require(tokenImplementationAddress != address(0),"This contract type does not exist");
            clone = Clones.clone(tokenImplementationAddress);
            ERC20TokenUpgradeable(clone).initialize(tokenName, tokenSymbol, totalSupply);
        }
        else {
            address tokenImplementationAddress = nameAddressSet["ERC20MintableUpgradeable"];
            require(tokenImplementationAddress != address(0),"This contract type does not exist");

            clone = Clones.clone(tokenImplementationAddress);
            ERC20MintableUpgradeable(clone).initialize(tokenName, tokenSymbol);
        }

        
        token = ERC20Upgradeable(clone);
        projectTokens[projectHash].token = clone;
        projectTokens[projectHash].proposer = msg.sender;
        emit TokenCreation(msg.sender, token.name(), token.symbol(),clone);

    }

    function assignToken(address tokenaddr, bytes32 projectHash) public {
        require(projectTokens[projectHash].token == address(0),"Some token already assigned to this project");
        projectManager.isValidToDistribute(msg.sender, projectHash);
        projectTokens[projectHash].token = tokenaddr;
        projectTokens[projectHash].proposer = msg.sender;
        ERC20 token = ERC20(tokenaddr);
        emit TokenCreation(msg.sender, token.name(), token.symbol(),address(token));
    }


}