pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./DutchAuction.sol";


//Strict Dutch Auction is just Dutch auction with constant decreasing auction token amount 
contract StrictDutchAuction is DutchAuction {

    uint public initTokens;

 
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
         numberOfTokensToBeDistributed =  getTotalSupply();
    }

    

    function getTotalSupply() public view virtual returns(uint timeSupply) {
        uint duration = endTime - startTime;
        if (startTime == 0)
            return initTokens;
        
        else if (block.timestamp >= latestEndTime)
            return soldProjectTokens;

        else if (block.timestamp < variableStartTime)
            return numberOfTokensToBeDistributed;
        
        
        uint timeTokens =  (initTokens - (initTokens) * (duration - (latestEndTime - block.timestamp))  /  (duration));
        //Number of tokens sold at least must be 1 higher than current sold or auction instnatly ends
        return timeTokens < soldProjectTokens ?  soldProjectTokens + 1 : timeTokens;
    }

    

      function finalize() internal override virtual{
        super.finalize();
        uint remainingBalance = projectToken.balanceOf(address(this));
        if (remainingBalance != 0)
            projectToken.burn(remainingBalance);
    
    }

}

