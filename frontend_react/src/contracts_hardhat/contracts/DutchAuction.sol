pragma solidity ^0.8.9;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/Maestro.sol";
contract DutchAuction{
    uint public startingPrice;
    uint public priceDeductionRate;
    ERC20 public projectToken;
    ERC20 public sucoin;
    Maestro public maestroSC;
    address public owner;
    uint public start = 0;
    uint public end = 0;
    uint public totalDeposited = 0;
    mapping (address => uint) public biddingBook;
    uint public numberOfTokensToBeDistributed;
    bool public isFinished = false;
    uint public minPrice;
    uint public finalPrice = startingPrice;
    bool public isStarted = false;
    //Events
    event BidSubmission(address indexed sender, uint256 amount, uint256 price);
    event AuctionFinished(uint round, uint finalPrice);
    event ClaimTokens(address indexed receiver, uint256 amount);
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
        uint _startingPrice,
        uint _priceDeductionRate,
        address _token,
        uint _numberOfTokensToBeDistributed,
        address _sucoinaddress,
        uint _minPrice,
        address _maestro,
        bytes32 projectHash
    ) {
        owner = msg.sender;
        priceDeductionRate = _priceDeductionRate;
        startingPrice = _startingPrice;
        numberOfTokensToBeDistributed = _numberOfTokensToBeDistributed;
        minPrice = _minPrice;
        sucoin = ERC20(_sucoinaddress);
        projectToken = ERC20(_token);
        maestroSC = Maestro(_maestro);
        maestroSC.AssignAuction(msg.sender, projectHash, _token, "DutchAuction");
    }

    function startAuction(uint periodInDays) public isAdmin(true){
        require(!isStarted, "Auction already started");
        require(projectToken.balanceOf(address(this))>= numberOfTokensToBeDistributed, "Balance of the contract is less than #tokens_to_be_distributed!!!");
        start= block.timestamp;
        end = block.timestamp + (periodInDays * 1 minutes);
        isStarted = true;
        emit AuctionStarted(start, end);
        
    }
    function finalize() private {
        isFinished = true;
        uint price = startingPrice - ((block.timestamp -start)*priceDeductionRate);
        finalPrice = price >= minPrice ? price: minPrice;
        end = block.timestamp;
        emit AuctionFinished(end, finalPrice);
        uint remaining = numberOfTokensToBeDistributed>=(totalDeposited/finalPrice) ? numberOfTokensToBeDistributed -(totalDeposited/finalPrice): 0;
        if (remaining > 0){
            projectToken.transfer(owner, remaining);
        }
    }

    function bid(uint amount) external isInInterval(true) Finished(false){
        require(amount >= minPrice, "Bid is less than the minimum allowed price!!");
        require(sucoin.balanceOf(msg.sender)>= amount, "insufficient funds to bid");
        sucoin.transferFrom(msg.sender, owner, amount);
        biddingBook[msg.sender] += amount;
        totalDeposited += amount;
        uint price = startingPrice - ((block.timestamp -start)*priceDeductionRate);
        finalPrice = price >= minPrice ? price: minPrice;
        emit BidSubmission(msg.sender, amount, finalPrice);
        if ((totalDeposited/finalPrice) >= numberOfTokensToBeDistributed){
            finalize();
        }
    }

    function claimTokens() external Finished(true){
        uint ratio = 10;
        if(numberOfTokensToBeDistributed < (totalDeposited/finalPrice)){
            ratio= (10*numberOfTokensToBeDistributed)/(totalDeposited/finalPrice);
        }
        uint amount = biddingBook[msg.sender];
        biddingBook[msg.sender] = 0;
        projectToken.transfer(msg.sender, ratio*(amount/(finalPrice*10)));
        emit ClaimTokens(msg.sender, ratio*(amount/(finalPrice*10)));
    }
}