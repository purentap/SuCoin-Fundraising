pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


//Dutch Auction is just FCFS auction with constant decreasing price 
contract DutchAuction is FCFSAuction {

    uint public finalRate;                              



  

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



     function setCurrentRate() internal virtual override {
        //Rate is how much bid coin bits a token cost totalCost
        //Current rate is decreased rate by time
        //Total cost is cost of all available auction tokens

        currentRate = rate - ((rate  - finalRate ) * (block.timestamp - startTime))  /  (latestEndTime - startTime);
    }

}

