pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


//Dutch Auction is just FCFS auction with constant decreasing price 
contract DutchAuction is FCFSAuction {

    uint public finalRate;                              



    //Maestro public maestroSC;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
        ,uint _rate,
         uint _finalRate
         )
        FCFSAuction(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate)
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

