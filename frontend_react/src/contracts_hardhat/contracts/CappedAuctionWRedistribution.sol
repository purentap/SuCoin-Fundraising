pragma solidity ^0.8.9;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/Maestro.sol";
contract CappedAuctionWRedistribution{
    uint public price;
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
    bool public isStarted = false;
    //Events
    event BidSubmission(address indexed sender, uint256 amount);
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
        uint _price,
        address _token,
        address _sucoin,
        uint _numberOfTokensToBeDistributed,
        address _maestro,
        bytes32 projectHash
    ){
        owner = msg.sender;
        price = _price;
        projectToken = ERC20(_token);
        sucoin = ERC20(_sucoin);
        numberOfTokensToBeDistributed = _numberOfTokensToBeDistributed;
        maestroSC = Maestro(_maestro);
        maestroSC.AssignAuction(msg.sender, projectHash, _token, "CappedAuctionWRedistribution");
    }

    function startAuction(uint periodInDays) public isAdmin(true){
        require(!isStarted, "Auction already started");
        require(projectToken.balanceOf(address(this))>= numberOfTokensToBeDistributed, "Balance of the contract is less than #tokens_to_be_distributed!!!");
        start= block.timestamp;
        end = block.timestamp + periodInDays;
        isStarted = true;
        emit AuctionStarted(start, end);
    }

    function finalize() private {
        uint remaining = numberOfTokensToBeDistributed>= (totalDeposited/price) ? (numberOfTokensToBeDistributed - (totalDeposited/price)) : 0;
        //console.log("Remaining project tokens are: %s", remaining);
        if (remaining > 0){
            projectToken.transfer(owner, remaining);
        }
        //console.log("Owner receives %s SUCoin", remaining > 0 ? totalDeposited : price*numberOfTokensToBeDistributed);
        sucoin.transfer(owner, remaining > 0 ? totalDeposited : price*numberOfTokensToBeDistributed);
        isFinished = true;
        end = block.timestamp;
        emit AuctionFinished(end, price);
    }

    function bid(uint amount) external isInInterval(true) Finished(false){
        require(amount >= price, "Bid is less than the minimum allowed price!!");
        sucoin.transferFrom(msg.sender, address(this), amount);
        totalDeposited += amount;
        biddingBook[msg.sender] += amount;
        //console.log("Sender bid is %s SUCoin", amount);
        emit BidSubmission(msg.sender, amount);
    }

    function claimTokens() external Finished(true){
        require(biddingBook[msg.sender]>0, "Has no right to claim token");
        uint amount = biddingBook[msg.sender];
        biddingBook[msg.sender] = 0;
        projectToken.transfer(msg.sender, (totalDeposited > (price*numberOfTokensToBeDistributed) ? (amount*1000/totalDeposited)*numberOfTokensToBeDistributed : amount*1000/price)/1000);
        //console.log("Senders claim is %s PRJ tokens", (totalDeposited > (price*numberOfTokensToBeDistributed) ? (amount*1000/totalDeposited)*numberOfTokensToBeDistributed : amount*1000/price)/1000);
        //console.log("Sender receive %s SUCoin cashback",(amount*1000 - (price*(totalDeposited > (price*numberOfTokensToBeDistributed) ? (amount*1000/totalDeposited)*numberOfTokensToBeDistributed : amount*1000/price)))/1000);
        sucoin.transfer(msg.sender, (amount*1000 - (price*(totalDeposited > (price*numberOfTokensToBeDistributed) ? (amount*1000/totalDeposited)*numberOfTokensToBeDistributed : amount*1000/price)))/1000);
        emit ClaimTokens(msg.sender, (totalDeposited > (price*numberOfTokensToBeDistributed) ? (amount*1000/totalDeposited)*numberOfTokensToBeDistributed : amount*1000/price)/1000);
    }
}