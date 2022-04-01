pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";




abstract contract Auction is Ownable{                                    //Abstract Contract for all auction types

    ERC20 public bidCoin;                                                     //Coin used for buying auction coins (Sucoin)
    uint public startTime;                                                    //Auction Start time in timestamp
    uint  public latestEndTime;                                               //Latest Auction end time in timestamp
    enum AuctionStatus{OFF,RUNNING,ENDED} 
    AuctionStatus public status;                                              //Current status of the auction         

                     


    event BidSubmission(address indexed sender, uint amount);              //Logs bidder and bid amount in bidCoin
    event AuctionFinished(uint end, uint finalPrice);                         //Logs ending time and final price of the coin 
    event AuctionStarted(uint start, uint end);                               //Logs beginning and latest ending time of an auction


                                                                              //Gets and sets auction information

 


    constructor(address _bidCoin) {
     

        status = AuctionStatus.OFF;
        bidCoin = ERC20(_bidCoin);


 
    }

     function manualFinish() public  stateUpdate() isFinished(){}



    modifier stateUpdate() {
        if (status == AuctionStatus.RUNNING && block.timestamp >= latestEndTime)
            finalize();
        _;
    }

    modifier isFinished() {
        require(status == AuctionStatus.ENDED,"Auction has not finished yet");
        _;
    }  

    modifier isRunning() {
        require(status == AuctionStatus.RUNNING,"Auction is not running");
        _;

    }

   function handleRemainder(uint bidCoinBits,uint currentRate) internal virtual returns (uint) {
        uint remainder = bidCoinBits -  (bidCoinBits / currentRate) * currentRate;
        return bidCoinBits - remainder;

    }

    function auctionStartCheckConditions(uint maximumAuctionTimeInHours) internal virtual {
        require(status == AuctionStatus.OFF,"Auction already started or already ended");
        require(maximumAuctionTimeInHours > 0,"Auction Time must be longer");
    }
                                                                            //Create the auction if the auction creator already deposited the coins or have given approval
    function startAuction(uint maximumAuctionTimeInHours) external virtual onlyOwner() {
        {
   
        auctionStartCheckConditions(maximumAuctionTimeInHours);

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

    function handleValidTimeBid(uint bidCoinBits) internal virtual;



     function bid(uint bidCoinBits)  external  virtual stateUpdate() isRunning() {

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits);
     }

     function tokenBuyLogic(uint bidCoinBits) internal virtual;

     function swap(uint bidCoinBits) internal virtual {
        
      
       

        //Check if buyer has approved this contracts bid coin usage

       uint allowance = bidCoin.allowance(msg.sender,address(this));
      
       require(allowance >= bidCoinBits,"Approved bid coin amount is not enough");

     

        //Check and process if buyer have the coins to do the swap

       bidCoin.transferFrom(msg.sender, owner(), bidCoinBits);

        //Send project tokens to buyer
       //No need for approval from the contracts side

       tokenBuyLogic(bidCoinBits);
       


    }
  

    
}

