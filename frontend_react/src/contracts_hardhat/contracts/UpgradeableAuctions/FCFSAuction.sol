pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./CappedTokenAuction.sol";

contract FCFSAuction is CappedTokenAuction {


    uint public currentRate;
 
    uint public rate;                                                         //How much a  bid coin bit worth project token  bids



    

      function initialize(auctionParameters calldata params) initializer override public virtual {
          __CappedTokenAuction_init(params);
          __FCFSAuction_init_unchained(params);


    } 

    function __FCFSAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing{
        currentRate = rate = params.rate;
    }

    function finalize() internal override virtual{
        super.finalize();
    
        //Withdraw the tokens if they are not used
        uint remaining = numberOfTokensToBeDistributed - soldProjectTokens;
        if (remaining > 0) {
            projectToken.transfer(projectWallet, remaining);
        }

        emit AuctionFinished(block.timestamp, currentRate);
    
    }

    function tokenBuyLogic(uint  bidCoinBits) virtual internal override{
        uint tokenCount = (bidCoinBits * (10 ** projectToken.decimals())) / currentRate;
        

        projectToken.transfer(msg.sender,tokenCount);
         

        soldProjectTokens += tokenCount;


        
        emit TokenBought(msg.sender, bidCoinBits, tokenCount);
    }

 






    //In a normal capped auction rate is constant so this function does nothing
    function setCurrentRate() internal virtual {

    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {

        setCurrentRate();
        //Contract needs to have tokens for bids
        uint buyableProjectTokens = numberOfTokensToBeDistributed - soldProjectTokens;
        require(buyableProjectTokens > 0,"No coins left for the auction");
        

      

        bidCoinBits = handleRemainder(bidCoinBits, currentRate);


        //Todo calculations could be better 
        uint totalCost = currentRate * (buyableProjectTokens) / (10 ** projectToken.decimals());
        require(bidCoinBits >= (totalCost / buyableProjectTokens) ,"Bidcoin amount lower than required to buy a token");

        

      

    
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



