pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";



abstract contract AuctionTrial is Ownable{                                    //Abstract Contract for all auction types

    ERC20 public projectToken;                                                //Auctioned coin
    ERC20 public bidCoin;                                                     //Coin used for buying auction coins (Sucoin)
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction
    uint public startTime;                                                    //Auction Start time in timestamp
    uint  public latestEndTime;                                               //Latest Auction end time in timestamp
    enum AuctionStatus{OFF,RUNNING,ENDED} 
    AuctionStatus public status;                                              //Current status of the auction                              
    uint public rate;                                                         //How much a  bid coin bit worth project token  bids


    event BidSubmission(address indexed sender, uint amount);              //Logs bidder and bid amount in bidCoin
    event AuctionFinished(uint end, uint finalPrice);                         //Logs ending time and final price of the coin 
    event AuctionStarted(uint start, uint end);                               //Logs beginning and latest ending time of an auction


                                                                              //Gets and sets auction information
    constructor(address _token, address _bidCoin, uint _numberOfTokensToBeDistributed,uint _rate) {
        require(_numberOfTokensToBeDistributed > 0,"Auction cannot happen because there are no tokens to auction");
        require(_rate >= 1,"1 Token should at least worth 1 sucoin bits");

        status = AuctionStatus.OFF;
        projectToken = ERC20(_token);
        bidCoin = ERC20(_bidCoin);
        numberOfTokensToBeDistributed = _numberOfTokensToBeDistributed;    
        rate = _rate;
        
    }
                                                                            //Create the auction if the auction creator already deposited the coins or have given approval
    function startAuction(uint maximumAuctionTimeInHours) external virtual onlyOwner() {
        {
        uint balance;
        uint allowance;
        uint neededAllowance;



        require(status == AuctionStatus.OFF,"Auction already started or already ended");
        require(maximumAuctionTimeInHours > 0,"Auction Time must be longer");


                                                                                            //Try to find how much more auction coins needed  to start the auction
        balance = projectToken.balanceOf(address(this));                  
        allowance = projectToken.allowance( msg.sender,address(this));              
        neededAllowance = (numberOfTokensToBeDistributed > balance) ?  (numberOfTokensToBeDistributed - balance) : 0;

        require(allowance >= neededAllowance,"You need to approve or deposit more coins to auction contract");
        
        if (neededAllowance > 0) //Get the remaining coins if contract has approval from owner
            require(projectToken.transferFrom(msg.sender, address(this), neededAllowance),"You don't have the auction coins");

        //Start the auction
        status = AuctionStatus.RUNNING;
        startTime = block.timestamp;
        latestEndTime = block.timestamp + maximumAuctionTimeInHours * 1 seconds;        //seconds instead of hours for test purposes
 
        emit AuctionStarted(startTime,latestEndTime);
    }
    }

    function finalize() internal virtual  {                                                     
        status = AuctionStatus.ENDED;
    }

    function bid(uint amount) external virtual;

  

    
}

