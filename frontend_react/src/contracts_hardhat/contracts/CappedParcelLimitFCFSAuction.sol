pragma solidity ^0.8.9;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/Maestro.sol";

contract CappedParcelLimitFCFSAuction{
    uint public price;
    ERC20 public projectToken;
    ERC20 public sucoin;
    Maestro public maestroSC;
    address public owner;
    mapping (address => uint) public biddingBook;
    uint public limit;
    uint public start = 0;
    uint public end = 0;
    uint public totalDeposited = 0;
    uint public numberOfTokensToBeDistributed;
    bool public isFinished = false;
    bool public isStarted = false;
    //Events
    event BidSubmission(address indexed sender, uint256 amount);
    event AuctionFinished(uint round, uint finalPrice);
    event AuctionStarted(uint start, uint end);
    //Modifiers
    modifier isInInterval(bool check){
        if (check){
            require(block.timestamp > start && start != 0, "Auction not started yet!!");
            require(block.timestamp < end, "Auction Expired!!");
        }else{
            require(block.timestamp > end, "Auction didn't finish yet!!");
        }
        _;
    }

    modifier Finished(bool check){
        if(check){
            require(isStarted, "Auction has not started yet!!!");
            require(block.timestamp > start && start!=0, "Auction not started yet!!");
            require(block.timestamp > end, "Auction hasn't finished!!");
            if (!isFinished) 
                finalize();
            require(isFinished, "Auction hasn't finished yet!!");
        }else{
            require(!isFinished, "Auction already finished");
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
        uint _price,
        address _token,
        address _sucoin,
        uint _numberOfTokensToBeDistributed,
        uint _limit,
        address _maestro,
        bytes32 projectHash
    ){
        owner = msg.sender;
        price = _price;
        projectToken = ERC20(_token);
        sucoin = ERC20(_sucoin);
        numberOfTokensToBeDistributed = _numberOfTokensToBeDistributed;
        limit = _limit;
        maestroSC = Maestro(_maestro);
        maestroSC.AssignAuction(msg.sender, projectHash, _token, "CappedParcelLimitFCFS");
    }

    function startAuction(uint periodInDays) public isAdmin(true){
        require(!isStarted, "Auction already started");
        require(projectToken.balanceOf(address(this))>= numberOfTokensToBeDistributed, "Balance of the contract is less than #tokens_to_be_distributed!!!");
        start= block.timestamp;
        end = block.timestamp + periodInDays* 1 days; //change later to days or hours
        isStarted = true;
        emit AuctionStarted(start, end);
    }

    function finalize() private {
        uint remaining = numberOfTokensToBeDistributed>= (totalDeposited/price) ? (numberOfTokensToBeDistributed - (totalDeposited/price)) : 0;
        if (remaining > 0){
            projectToken.transfer(owner, remaining);
        }
        isFinished = true;
        end = block.timestamp;
        emit AuctionFinished(end, price);
    }
    // Return a exceeded amount to user back if there no enough token supply
    function bid(uint amount) external isInInterval(true) Finished(false){
        require(amount >= price, "Bid is less than the minimum allowed price!!");
        require(sucoin.balanceOf(msg.sender)>= amount, "insufficient funds");
        require((biddingBook[msg.sender] + amount/price)<= limit, "Exceeds tokens per account policies.");
        uint remaining = numberOfTokensToBeDistributed >= (totalDeposited/price) ? numberOfTokensToBeDistributed - (totalDeposited/price): 0;
        if(remaining >0){
            sucoin.transferFrom(msg.sender, owner, remaining >= (amount/price) ? amount: remaining*price);
            totalDeposited += remaining >= (amount/price) ? amount: remaining*price;
            biddingBook[msg.sender] += amount/price;
            projectToken.transfer(msg.sender, remaining >= (amount/price) ? amount/price: remaining);
            emit BidSubmission(msg.sender, amount);
            if ((totalDeposited/price) >= numberOfTokensToBeDistributed){
                finalize();
            }
        }
    }

    function withdrawRemaining() external isAdmin(true) Finished(true) returns(bool){
        return true;
    }
}