pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./OBFCFSAuction.sol";


//This is just order book capped auction but users have buy limit
contract FCFSLimitAuction is OBFCFSAuction {

    uint public maxTokensPerUser;

    modifier limitControl(uint bidCoinBits) {
        require((biddingBook[msg.sender] + bidCoinBits / currentRate) <= maxTokensPerUser,"You are trying to buy more than your limit");
        _;
    }


    function tokenBuyLogic(uint bidCoinBits) internal virtual override limitControl(bidCoinBits){
        super.tokenBuyLogic(bidCoinBits);
    }

    function __FCMFSLimitAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing{
      require(params.limit > 0,"Users should be able to buy tokens");
      maxTokensPerUser = params.limit;
    }

    
   function initialize(auctionParameters calldata params) initializer public override virtual{
       __CappedTokenAuction_init(params);
       __FCFSAuction_init_unchained(params);
        __FCMFSLimitAuction_init_unchained(params);
    }
    

 



  

}

