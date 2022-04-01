pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./OBFCFSAuction.sol";


//This is just order book capped auction but users have buy limit
contract FCFSLimitAuction is OBFCFSAuction {

    uint maxTokensPerUser;

    modifier limitControl(uint bidCoinBits) {
        require((biddingBook[msg.sender] + bidCoinBits / currentRate) <= maxTokensPerUser,"You are trying to buy more than your limit");
        _;
    }


    function tokenBuyLogic(uint bidCoinBits) internal virtual override limitControl(bidCoinBits){
        super.tokenBuyLogic(bidCoinBits);
    }

    

    

    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed,
        uint _rate,
        uint _maxTokensPerUser
        
         )
        OBFCFSAuction(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate)
        {
            require(_maxTokensPerUser > 0,"Users should be able to buy tokens");
            maxTokensPerUser = _maxTokensPerUser;
        }



  

}

