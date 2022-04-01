pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/AbstractAuctions/CappedTokenAuction.sol";

contract FCFSAuction is CappedTokenAuction {


    uint public currentRate;
 
    uint public rate;                                                         //How much a  bid coin bit worth project token  bids



    //Maestro public maestroSCa;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed,
        uint _rate
         )
        CappedTokenAuction(_token,_bidCoin,_numberOfTokensToBeDistributed)
        {

      

        require(_rate >= 1,"1 Token should at least worth 1 sucoin bits");  
        currentRate = rate = _rate;

    }

    function finalize() internal override{
        super.finalize();
    
        //Withdraw the tokens if they are not used
        uint remaining = numberOfTokensToBeDistributed - soldProjectTokens;
        if (remaining > 0) {
            projectToken.transfer(owner(), remaining);
        }

        emit AuctionFinished(block.timestamp, currentRate);
    
    }

    function tokenBuyLogic(uint  bidCoinBits) virtual internal override{
        uint tokenCount = bidCoinBits / currentRate;

        projectToken.transfer(msg.sender,tokenCount);
         

        soldProjectTokens += tokenCount;


        
        emit TokenBought(msg.sender, bidCoinBits, tokenCount);
    }

 






    //In a normal capped auction rate is constant so this function does nothing
    function setCurrentRate() internal virtual {

    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {

        //Contract needs to have tokens for bids
        uint buyableProjectTokens = numberOfTokensToBeDistributed - soldProjectTokens;
        require(buyableProjectTokens > 0,"No coins left for the auction");
        

        setCurrentRate();
        require(bidCoinBits >= currentRate,"Bidcoin amount lower than required to buy a token");

        bidCoinBits = handleRemainder(bidCoinBits, currentRate);



        uint totalCost = currentRate * (buyableProjectTokens);
        

      

    
        //Check how many coins buyer can buy with his money (amount) 
        if (bidCoinBits >= totalCost) {
        //Buyer is able to buy all the remaining tokens and auction must finish when all coins are bought
         swap(totalCost);
         finalize();
        } 
        else {
            //Buyer is able to buy some tokens
           swap(bidCoinBits);
        }
    } 
    






}



