pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";
import "../UpgradeableTokens/ERC20MintableBurnableUpgradeable.sol";

abstract contract CappedTokenAuction is Auction {

    ERC20MintableBurnableUpgradeable public projectToken;                                          //Coin used for buying auction coins (Sucoin)

    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens

    //Maestro public maestroSCa;

       function revertPrice(uint formattedAmount,ERC20 token) internal virtual view returns(uint) {
             return formattedAmount / 10 ** token.decimals();
        }

        function convertPrice(uint normalAmount,ERC20 token) internal virtual view returns(uint){
            return normalAmount * 10 ** token.decimals();
        }

  

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



