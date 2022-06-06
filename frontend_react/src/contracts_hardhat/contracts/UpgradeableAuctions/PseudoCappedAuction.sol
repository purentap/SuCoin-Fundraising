pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./CappedTokenAuction.sol";


/*
    This auction type has specific amount of tokens to be auctioned.
    Auction ends when time is up.
    When time is up proportional to how many sucoins were invest by users all the tokens will be distributed.
    More sucoin invested - higher priced token.
    Unless no one invested in the auction, then all of them are burned.

    There is no actual price in this auction so even if only one user invested miniscule amount of sucoins all tokens will be sold.
*/

contract PseudoCappedAuction is CappedTokenAuction {


    uint public currentRate;


    mapping (address => uint) public biddingBook;  //Orderbook



   

    function initialize(auctionParameters calldata params)  override virtual initializer public {
        __CappedTokenAuction_init(params);
        __PseudoCappedAuction_init_unchained(params);
    }

    function __PseudoCappedAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        soldProjectTokens = params.numberOfTokensToBeDistributed;
    }

    function finalize() internal override virtual{
        super.finalize();

        soldProjectTokens = numberOfTokensToBeDistributed;


        //All tokens are burned if no one invested
        if (soldProjectTokens == 0) 
            projectToken.burn(projectToken.balanceOf(address(this)));
        


    
        emit AuctionFinished(block.timestamp, currentRate);
    
    }

    function withDraw()  external virtual quietStateUpdate() isFinished() {    //Users can withdraw their tokens if the auction is finished


        //This function may cause loss of some sucoins (owner gets more coins then needed)

        uint userDepositAmount = biddingBook[msg.sender];
        require(userDepositAmount > 0, "You don't have any tokens to withdraw");
        biddingBook[msg.sender] = 0;
       

        //Send tokens to buyer
        projectToken.transfer(msg.sender, (userDepositAmount * 10 ** projectToken.decimals()) / currentRate);
    
    }

    
    function tokenBuyLogic(uint bidCoinBits) internal virtual override {
            biddingBook[msg.sender] += bidCoinBits;
            setCurrentRate();

        }


      function setCurrentRate() internal virtual  {
        uint tempRate = getCurrentRate();
        if (tempRate != currentRate)
        {
            emit VariableChange("currentRate", tempRate);
            currentRate = tempRate;
        }
        
    }

    

    function getCurrentRate() public  virtual view returns(uint current) {
        return totalDepositedSucoins * (10 ** projectToken.decimals()) / numberOfTokensToBeDistributed;
    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {

        
        require(bidCoinBits >= (currentRate / (10 ** projectToken.decimals())),"Bidcoin amount lower than required to buy a token");
        swap(bidCoinBits);    

      

    
    } 

    
    


   




}

