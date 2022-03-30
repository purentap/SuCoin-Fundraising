pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./OBCappedAuctionTrial.sol";


//This is just order book capped auction but users have buy limit
contract CappedLimitAuctionTrial is OBCappedAuctionTrial {

    uint maxTokensPerUser;


    function tokenBuyLogic(address buyer,uint  projectTokenBits) override internal{
        require(projectTokenBits + biddingBook[buyer] <= maxTokensPerUser,"You are trying to buy more than your limit");
        biddingBook[buyer] += projectTokenBits;
    }

    

    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed,
        uint _rate,
        uint _maxTokensPerUser
        
         )
        OBCappedAuctionTrial(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate)
        {
            require(_maxTokensPerUser > 0,"Users should be able to buy tokens");
            maxTokensPerUser = _maxTokensPerUser;
        }



  

}

