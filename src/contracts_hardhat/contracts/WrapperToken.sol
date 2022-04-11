// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrapperToken is ERC20{
    ERC20 public immutable underlying;

    event Mint(
        address buyer,
        uint amount
    );

    event Burn(
        address spender,
        uint amount
    );

    event Recover(
        address receiver,
        uint amount
    );

    modifier RejectZeroAddress(address addr){
        require(addr != address(0), "Transaction to address(0)!");
        _;
    }

    modifier RejectZeroAmount(uint amount){
        require(amount > 0, "Transaction with zero value!");
        _;
    }

    constructor(string memory tokenName, string memory tokenSymbol, address _underlying) ERC20(tokenName, tokenSymbol){
        if(_underlying == address(0)){
            revert("Underlying asset address missing.");
        }
        underlying = ERC20(_underlying);
    }

    function depositFor(address account, uint256 amount) public RejectZeroAddress(account) RejectZeroAmount(amount) returns (bool) {
        underlying.transferFrom(msg.sender, address(this), amount);
        _mint(account, amount);
        emit Mint(msg.sender, amount);
        return true;
    }

    function withdrawTo(address account, uint256 amount) public RejectZeroAddress(account) RejectZeroAmount(amount) returns(bool){
        _burn(msg.sender, amount);
        underlying.transfer(account, amount);
        emit Burn(msg.sender, amount);
        return true;
    }

    function recover(address account) public RejectZeroAddress(account) returns (uint256) {
        uint256 value = underlying.balanceOf(address(this)) - totalSupply();
        _mint(account, value);
        emit Recover(msg.sender, value);
        return value;
    }
}
