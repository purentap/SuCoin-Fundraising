pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";
import "../UpgradeableTokens/ERC20MintableUpgradeable.sol";

abstract contract CappedTokenAuction is Auction {

    ERC20MintableUpgradeable public projectToken;                                          //Coin used for buying auction coins (Sucoin)

    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens

    //Maestro public maestroSCa;

       function revertPrice(uint formattedAmount) internal virtual view returns(uint) {
             return formattedAmount / 10 ** projectToken.decimals();
        }

        function convertPrice(uint normalAmount) internal virtual view returns(uint){
            return normalAmount * 10 ** projectToken.decimals();
        }

  

    function __CappedTokenAuction_init(auctionParameters calldata params) internal onlyInitializing {
        __Auction_init(params);
        __CappedTokenAuction_init_unchained(params);
    }

    function __CappedTokenAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        require(params.numberOfTokensToBeDistributed > 0,"Auction cannot happen because there are no tokens to auction");
        projectToken = ERC20MintableUpgradeable(params.token);
        numberOfTokensToBeDistributed = params.numberOfTokensToBeDistributed;   
    }


}



