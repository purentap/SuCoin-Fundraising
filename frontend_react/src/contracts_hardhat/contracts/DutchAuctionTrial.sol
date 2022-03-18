pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/Auction.sol";

contract DutchAuctionTrial is Auction {

    uint public currentRate;
    uint public timeToFinalRate;    
    uint public finalRate;                              
    uint public soldProjectTokens;                                  
    uint public downFactor;                                                    //Hourly percent price decrease from initialPrice  
    bool coinToToken;                                                          //If rates are coin over token or reverse

    event TokenBought(address indexed buyer,uint usedBidCoinAmount, uint boughtTokenAmount );        //Logs bought auction tokens


    //Maestro public maestroSC;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
        ,uint _rate,
        //Maestro _maestro,
         //bytes32 projectHash
         uint _finalRate
         )
        Auction(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate)
        {
        //maestroSC = Maestro(_maestro);
        //maestroSC.AssignAuction(msg.sender, projectHash, _token, "DutchAuction");
        finalRate = _finalRate;
        


        require((finalRate <= rate),"Final Rate must be lower or equal than Initial rate");

        currentRate = rate;


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

    function swap(address buyer,uint bidCoinBits,uint projectTokenBits) private {
        
      
       

        //Check if buyer has approved this contracts bid coin usage

       uint allowance = bidCoin.allowance(buyer,address(this));
      
       require(allowance >= bidCoinBits,"Approved bid coin amount is not enough");

        //Check and process if buyer have the coins to do the swap

       require(bidCoin.transferFrom(buyer, address(this), bidCoinBits),"Buyer does not have enough bid coin");

      

        //Send project tokens to buyer
       //No need for approval from the contracts side
    

       require(projectToken.transfer(buyer , projectTokenBits),"Something went wrong");
       soldProjectTokens += projectTokenBits;


        
        emit TokenBought(buyer, bidCoinBits, projectTokenBits);


    }

    function withDraw() external onlyOwner {  //Must be used by owner if your coins not bought prior to ending time and no one tried bidding after ending time
        require(status == AuctionStatus.RUNNING,"Auction is not active");
        require(block.timestamp >= latestEndTime,"Until auction time ends you can not withdraw your tokens");
        finalize();
    }

    function bid(uint bidCoinBits) override external  {

        emit BidSubmission(msg.sender, bidCoinBits);

        require(status == AuctionStatus.RUNNING,"Auction is not active");
        if (block.timestamp >= latestEndTime) 
            //todo Buyer won't lose sucoin but won't be able to buy tokens either if code goes to here, need a way to notify the buyer
            finalize();
        else {
        //Contract needs to have tokens for bids
        uint buyableProjectTokens = numberOfTokensToBeDistributed - soldProjectTokens;
        require(buyableProjectTokens > 0,"No coins left for the auction");
        

        //Rate is how much bid coin bits a token cost totalCost
        //Current rate is decreased rate by time
        //Total cost is cost of all available auction tokens

        currentRate = rate - ((rate  - finalRate ) * (block.timestamp - startTime))  /  (latestEndTime - startTime);

        uint totalCost = currentRate * (buyableProjectTokens / 10 ** projectToken.decimals());
        

      

    
        //Check how many coins buyer can buy with his money (amount) 
        if (bidCoinBits >= totalCost) {
        //Buyer is able to buy all the remaining tokens and auction must finish when all coins are bought
         swap(msg.sender,totalCost, buyableProjectTokens);
         finalize();
        } 
        else {
            //Buyer is able to buy some tokens
           swap(msg.sender,bidCoinBits, (buyableProjectTokens * bidCoinBits / totalCost));
        }
        }

    }


}

