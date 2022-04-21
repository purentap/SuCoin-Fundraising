pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

import "contracts/Maestro.sol";




abstract contract AuctionTrial is Ownable,Multicall{                           //Abstract Contract for all auction types

    ERC20 public bidCoin;                                                     //Coin used for buying auction coins (Sucoin)
    uint public startTime;                                                    //Auction Start time in timestamp
    uint  public latestEndTime;                                               //Latest Auction end time in timestamp
    enum AuctionStatus{OFF,RUNNING,ENDED} 
    AuctionStatus public status;                                              //Current status of the auction         
    Maestro public maestroSC;
                     


    event BidSubmission(address indexed sender, uint amount);              //Logs bidder and bid amount in bidCoin
    event AuctionFinished(uint end, uint finalPrice);                         //Logs ending time and final price of the coin 
    event AuctionStarted(uint start, uint end);                               //Logs beginning and latest ending time of an auction


                                                                              //Gets and sets auction information
    constructor(address _bidCoin,address _maestro,address _token,bytes32 projectHash) {
     

        status = AuctionStatus.OFF;
        bidCoin = ERC20(_bidCoin);
        maestroSC = Maestro(_maestro);
        maestroSC.AssignAuction(msg.sender, projectHash, _token, "DutchAuctionTrial");
 
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



     function bid(uint bidCoinBits)  external  virtual {

        emit BidSubmission(msg.sender, bidCoinBits);

        require(status == AuctionStatus.RUNNING,"Auction is not active");
        if (block.timestamp >= latestEndTime) 
            //todo Buyer won't lose sucoin but won't be able to buy tokens either if code goes to here, need a way to notify the buyer
            finalize();
        else 
            handleValidTimeBid(bidCoinBits);
     }
  

    
}

