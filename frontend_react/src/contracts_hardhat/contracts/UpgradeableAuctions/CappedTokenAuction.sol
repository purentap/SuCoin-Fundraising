pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";

abstract contract CappedTokenAuction is Auction {

    ERC20Upgradeable public projectToken;                                          //Coin used for buying auction coins (Sucoin)

    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens

    //Maestro public maestroSCa;
  

    function __CappedTokenAuction_init(auctionParameters calldata params) internal onlyInitializing {
        __Auction_init(params);
        __CappedTokenAuction_init_unchained(params);
    }

    function __CappedTokenAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        require(params.numberOfTokensToBeDistributed > 0,"Auction cannot happen because there are no tokens to auction");
        projectToken = ERC20Upgradeable(params.token);
        numberOfTokensToBeDistributed = params.numberOfTokensToBeDistributed;   
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



