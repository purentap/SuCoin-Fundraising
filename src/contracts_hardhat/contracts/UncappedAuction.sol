pragma solidity ^0.8.9;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/TokenMintable.sol";

contract UncappedAuction {
    uint256 public price;
    TokenMintable public projectToken;
    ERC20 public sucoin;
    address public owner;
    uint256 public start = 0;
    uint256 public end = 0;
    uint256 public totalDeposited = 0;
    bool public isStarted = false;
    uint public ratio;
    event BidSubmission(address indexed sender, uint256 amount);
    event AuctionStarted(uint start, uint end);
    modifier isInInterval(bool check) {
        if (check) {
            require(
                block.timestamp > start && start != 0,
                "Auction not started yet!!"
            );
            require(block.timestamp < end, "Auction Expired!!");
        } else {
            require(block.timestamp > end, "Auction didn't finish yet!!");
        }
        _;
    }

    modifier isAdmin(bool check){
        if(check){
            require(msg.sender == owner, "Only Admin allowed");    
        }else{
            require(msg.sender != owner, "Owner not allowed");
        }
        _;
    }

    constructor(
        address _owner,
        uint _price,
        address _sucoin,
        uint _ratio
    ){
        owner = _owner;
        price = _price;
        sucoin = ERC20(_sucoin);
        ratio = _ratio;
    }

    function startAuction(uint periodInDays, address _token) public isAdmin(true){
        require(!isStarted, "Auction already started");
        require(_token != address(0),"invalid token address: address(0)");
        projectToken = TokenMintable(_token);
        start= block.timestamp;
        end = block.timestamp + periodInDays* 1 days;
        isStarted = true;
        emit AuctionStarted(start, end);
    }

    function bid(uint amount) external isInInterval(true){
        require(amount >= price, "Bid is less than the minimum allowed price!!");
        require(sucoin.balanceOf(msg.sender)>= amount, "insufficient funds");
        sucoin.transferFrom(msg.sender, owner, amount);
        totalDeposited += amount;
        projectToken.mint(msg.sender, amount/price, owner, ratio);
        emit BidSubmission(msg.sender, amount);
    }

}
