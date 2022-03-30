pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./CappedAuctionTrial.sol";


//This auction is just capped auction but uses orderbook instead of swaps
contract OBCappedAuctionTrial is CappedAuctionTrial {


    mapping (address => uint) public biddingBook;


    function tokenBuyLogic(address buyer,uint  projectTokenBits) override internal{
        biddingBook[buyer] += projectTokenBits;
    }

    function withDraw()  external stateUpdate() isFinished() {  
        uint amount = biddingBook[msg.sender];
        require(amount > 0, "You don't have any tokens to withdraw");
        biddingBook[msg.sender] = 0;
        projectToken.transfer(msg.sender, amount);
    
    }

    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
        ,uint _rate
         )
        CappedAuctionTrial(_token,_bidCoin,_numberOfTokensToBeDistributed,_rate)
        {


    }



  

}

