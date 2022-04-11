// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";
contract TokenMintable is ERC20{
    address public immutable auctionAddr;
    modifier RejectZeroAddress(address addr){
        require(addr != address(0), "Transaction to address(0)!");
        _;
    }
    constructor(string memory tokenName, string memory tokenSymbol, address _auctionAddr) ERC20(tokenName, tokenSymbol) RejectZeroAddress(_auctionAddr){  
        auctionAddr = _auctionAddr; 
    }
    
    function mint(address to, uint256 amount, address owner, uint ratio) external RejectZeroAddress(to) RejectZeroAddress(owner){
        require(msg.sender == auctionAddr);
        _mint(to, amount);
        _mint(owner, ratio*(amount/(100-ratio)));
    }
}

