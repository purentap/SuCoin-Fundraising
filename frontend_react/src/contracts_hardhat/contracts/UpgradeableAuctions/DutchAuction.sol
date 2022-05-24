pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


//Dutch Auction is just FCFS auction with constant decreasing price 
contract DutchAuction is FCFSAuction {

    uint public finalRate;
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


    function startAuction(uint maximumAuctionTimeInHours) public virtual override {
        super.startAuction(maximumAuctionTimeInHours);
        endTime = latestEndTime;
    }
    

      function getCurrentRate() public virtual view override returns(uint current) {
        uint duration = endTime - startTime;
          if (startTime == 0)
            return rate;
          else if (block.timestamp >= latestEndTime)
            return finalRate;
          return (rate - ((rate  - finalRate ) * (duration - (latestEndTime - block.timestamp)))  /  (duration));

    }

}

