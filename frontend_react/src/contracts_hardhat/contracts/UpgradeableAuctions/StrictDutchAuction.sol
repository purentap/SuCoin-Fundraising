pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./DutchAuction.sol";


//Strict Dutch Auction is just Dutch auction with constant decreasing auction token amount 
contract StrictDutchAuction is DutchAuction {

    uint initTokens;

 
    function initialize(auctionParameters calldata params) public initializer override virtual {
        
        __CappedTokenAuction_init(params);

        __FCFSAuction_init_unchained(params);

        __DutchAuction_init_unchained(params);

        __StrictDutchAuction_init_unchained();
    }
    
    function __StrictDutchAuction_init_unchained() internal onlyInitializing{
        initTokens = numberOfTokensToBeDistributed;
    }

     function setCurrentRate() internal virtual override {
         super.setCurrentRate();
         uint timeTokens =  getTotalSupply();

        //Number of tokens sold at least must be 1 higher than current sold or auction instnatly ends
        numberOfTokensToBeDistributed = timeTokens < soldProjectTokens ?  soldProjectTokens + 1 : timeTokens;
    }

    function getTotalSupply() public view virtual  returns(uint timeSupply) {
        return  latestEndTime <= startTime ? initTokens : (initTokens - (initTokens) * (block.timestamp - startTime)  /  (latestEndTime - startTime));
    }

    

      function finalize() internal override virtual{
        super.finalize();
        uint remainingBalance = projectToken.balanceOf(address(this));
        if (remainingBalance != 0)
            projectToken.burn(remainingBalance);
    
    }

}

