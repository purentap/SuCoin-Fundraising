pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./FCFSAuction.sol";


//This auction is just capped auction but uses orderbook instead of swaps
contract OBFCFSAuction is FCFSAuction {


    mapping (address => uint) public biddingBook;  //Orderbook


   //Instead of swaping it just increases user orderbook size


    function tokenBuyLogic(uint bidCoinBits) internal override virtual  {
        uint tokenCount = (bidCoinBits * (10 ** projectToken.decimals())) / currentRate;
        biddingBook[msg.sender] += tokenCount;
        soldProjectTokens += tokenCount;


        
        emit TokenBought(msg.sender, bidCoinBits, tokenCount);   
         }

   

    function withDraw()  external stateUpdate() isFinished() {    //Users can withdraw their tokens if the auction is finished
        uint amount = biddingBook[msg.sender];
        require(amount > 0, "You don't have any tokens to withdraw");
        biddingBook[msg.sender] = 0;
        projectToken.transfer(msg.sender, amount);
    
    }

 

    function __OBFCFSAuction_init_unchained() internal onlyInitializing {

    }



  

}

