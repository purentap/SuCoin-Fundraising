pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";

abstract contract CappedTokenAuction is Auction {

    ERC20 public projectToken;                                                //Auctioned coin

    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens

    //Maestro public maestroSCa;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
     
         )
        Auction(_bidCoin)
        {

      

        require(_numberOfTokensToBeDistributed > 0,"Auction cannot happen because there are no tokens to auction");
        projectToken = ERC20(_token);
        numberOfTokensToBeDistributed = _numberOfTokensToBeDistributed;    

    }



    






    

    function auctionStartCheckConditions(uint maximumAuctionTimeInHours ) internal virtual override {
        super.auctionStartCheckConditions(maximumAuctionTimeInHours);
        uint balance;
        uint allowance;
        uint neededAllowance;

        //Try to find how much more auction coins needed  to start the auction
        balance = projectToken.balanceOf(address(this));                  
        allowance = projectToken.allowance( msg.sender,address(this));              
        neededAllowance = (numberOfTokensToBeDistributed > balance) ?  (numberOfTokensToBeDistributed - balance) : 0;

        require(allowance >= neededAllowance,"You need to approve or deposit more coins to auction contract");
        
        if (neededAllowance > 0) //Get the remaining coins if contract has approval from owner
            require(projectToken.transferFrom(msg.sender, address(this), neededAllowance),"You don't have the auction coins");

    }




}



