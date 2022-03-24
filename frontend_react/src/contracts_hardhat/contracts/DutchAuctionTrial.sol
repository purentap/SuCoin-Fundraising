pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/CappedAuctionTrial.sol";


//Dutch Auction is just capped auction with constant decreasing price 
contract DutchAuctionTrial is CappedAuctionTrial {

    uint public finalRate;                              



    //Maestro public maestroSC;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
        ,uint _rate,
        address _maestro,
         bytes32 projectHash,
         uint _finalRate
         )
        CappedAuctionTrial(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate,_maestro,projectHash)
        {

        finalRate = _finalRate;
        
        require((finalRate <= rate),"Final Rate must be lower or equal than Initial rate");



    }



     function setCurrentRate() internal override {
        //Rate is how much bid coin bits a token cost totalCost
        //Current rate is decreased rate by time
        //Total cost is cost of all available auction tokens

        currentRate = rate - ((rate  - finalRate ) * (block.timestamp - startTime))  /  (latestEndTime - startTime);
    }

}

