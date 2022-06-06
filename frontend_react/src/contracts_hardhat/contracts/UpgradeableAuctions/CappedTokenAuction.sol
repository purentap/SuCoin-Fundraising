pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";
import "../UpgradeableTokens/ERC20MintableBurnableUpgradeable.sol";

/*
    Abstract contract for auctions which have a specific number of tokens to be auctioned.
    It has numberOfTokensToBeDistributed and soldProjectTokens parameters.
    The auction is finished when the number of tokens sold equals the number of tokens to be auctioned.
    Or when the auction time is over.
*/


abstract contract CappedTokenAuction is Auction {

    ERC20MintableBurnableUpgradeable public projectToken;                                          //Coin used for buying auction coins (Sucoin)

    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                                          //Total coin amount owner wants to auction


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens


   

    function __CappedTokenAuction_init(auctionParameters calldata params) internal onlyInitializing {
        __Auction_init(params);
        __CappedTokenAuction_init_unchained(params);
    }


    function __CappedTokenAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        require(params.numberOfTokensToBeDistributed > 0,"Auction cannot happen because there are no tokens to auction");
        projectToken = ERC20MintableBurnableUpgradeable(params.token);
        numberOfTokensToBeDistributed = params.numberOfTokensToBeDistributed;   
    }


}



