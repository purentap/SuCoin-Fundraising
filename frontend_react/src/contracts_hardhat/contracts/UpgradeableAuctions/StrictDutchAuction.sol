pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./DutchAuction.sol";


//Strict Dutch Auction is just Dutch auction with constant decreasing auction token amount 
contract StrictDutchAuction is DutchAuction {

    uint initTokens;

    function initialize(auctionParameters calldata params) initializer public override virtual {
        super.initialize(params);
        __StrictDutchAuction_init_unchained();
    }

    function __StrictDutchAuction_init_unchained() internal onlyInitializing{
        initTokens = numberOfTokensToBeDistributed;
    }

     function setCurrentRate() internal virtual override {
         super.setCurrentRate();
         uint timeTokens =  initTokens - (initTokens) * (block.timestamp - startTime)  /  (latestEndTime - startTime);

        //Number of tokens sold at least must be 1 higher than current sold or auction instnatly ends
        numberOfTokensToBeDistributed = timeTokens < soldProjectTokens ?  soldProjectTokens + 1 : timeTokens;
    }

}

