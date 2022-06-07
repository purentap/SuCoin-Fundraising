pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


/*
    This auction type has specific amount of tokens to be auctioned.
    Price goes down by time from initial price to final price linearly.
    Auction ends when the number of tokens sold equals the number of tokens to be auctioned or time is up.

    OBDutchAuction is more close to original dutch auction

    todo Change timestamps to blocknumber
*/

contract DutchAuction is FCFSAuction {
    //Price when time is up lower than initial rate as this is a decreasing price auction
    uint public finalRate;
    //When the auction time is over
    uint internal endTime;                            



  

    function initialize(auctionParameters calldata params) initializer public override virtual {

        __CappedTokenAuction_init(params);

        __FCFSAuction_init_unchained(params);

        __DutchAuction_init_unchained(params);
    }

    function __DutchAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing{
        finalRate = params.finalRate;
      
        
        require((finalRate > 0),"Final Rate must be higher than 0");
        require((finalRate < rate),"Final Rate must be lower than Initial rate");
    }


    //For testing it is actually usings seconds
    function startAuction(uint maximumAuctionTimeInHours) public virtual override {
        super.startAuction(maximumAuctionTimeInHours);
        endTime = latestEndTime;
    }


    //Because of the way the auction works, time changes the price
    //But when it is paused time should also pause
    //So current rate also must be paused and stored just before pause

      function pauseAuction(uint pauseTimeInHours) public virtual override  {
        setCurrentRate();
        super.pauseAuction(pauseTimeInHours);
    }
    

    
      function getCurrentRate() public virtual view override returns(uint current) {
        uint duration = endTime - startTime;
        //Auction not started yet
          if (startTime == 0)
            return rate;
          //Auction already ended
          else if (status == AuctionStatus.ENDED || block.timestamp >= latestEndTime)
            return finalRate;
          //Auction is paused
          else if (block.timestamp < variableStartTime)
            return currentRate;
          //Linear calculation for current rate
          return (rate - ((rate  - finalRate ) * (duration - (latestEndTime - block.timestamp)))  /  (duration));

    }

}

