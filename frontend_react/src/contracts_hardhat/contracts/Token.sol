// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20{
    constructor(string memory tokenName, string memory tokenSymbol, uint amount, address to) ERC20(tokenName, tokenSymbol){
        if(to == address(0)){
            _mint(msg.sender, amount);
        }else{
            _mint(to, amount);
        }
    }
}

