pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


//This auction is just capped auction but uses orderbook instead of swaps

//Orderbook based auctions also use limit (How much sucoin can a user buy)

//todo create abstract class for orderbook auction types (OBDutch,OBFCFS,PseudoCapped)

contract OBFCFSAuction is FCFSAuction {


    mapping (address => uint) public biddingBook;  //Orderbook

    uint public fundLimitPerUser;

   //Instead of swaping it just increases user orderbook size


      function initialize(auctionParameters calldata params) public initializer override virtual {
        
        __CappedTokenAuction_init(params);

        __FCFSAuction_init_unchained(params);

        __OBFCFSAuction_init_unchained(params);
    }
    

 
   modifier limitControl(uint bidCoinBits) {
        require(fundLimitPerUser == 0 || (biddingBook[msg.sender] + bidCoinBits) <= fundLimitPerUser ,"You are trying to buy more than your limit");
        _;
    }


    function tokenBuyLogic(uint bidCoinBits) internal override virtual limitControl(bidCoinBits) {
        //tokenCount used for increaing soldProjectTokens (not good because it is also used in withdraw)
        uint tokenCount = (bidCoinBits * (10 ** projectToken.decimals())) / currentRate;
        biddingBook[msg.sender] += bidCoinBits;
        soldProjectTokens += tokenCount;


        
        emit TokenBought(msg.sender, bidCoinBits, tokenCount);   
         }

   

    function withDraw()  external quietStateUpdate() isFinished() {    //Users can withdraw their tokens if the auction is finished
        //total fund of user
        uint bidCoinBits = biddingBook[msg.sender];
        //How many tokens user will take
        uint tokenCount = (bidCoinBits * (10 ** projectToken.decimals())) / currentRate;


        //Don't bothet if user can't get any tokens
        require(tokenCount > 0, "You don't have any tokens to withdraw");
        biddingBook[msg.sender] = 0;
        projectToken.transfer(msg.sender, tokenCount);
    
    }

 
    //Uses limit per user
    function __OBFCFSAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        fundLimitPerUser = params.limit;
    }




  

}

