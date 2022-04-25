pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./CappedTokenAuction.sol";


//This is a contract with fixed token supply but has unlimited sucoin allocation (until the time ends) then tokens are distrubted 
//with regars to sucoin holdings
//There is good chance users will get less than normal amount for their sucoin using this auction

contract PseudoCappedAuction is CappedTokenAuction {


    uint public currentRate;
    uint public totalDepositedSucoins;


    mapping (address => uint) public biddingBook;  //Orderbook



   

    function initialize(auctionParameters calldata params)  override initializer public {
        __CappedTokenAuction_init(params);
        __PseudoCappedAuction_init_unchained(params);
    }

    function __PseudoCappedAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
        soldProjectTokens = params.numberOfTokensToBeDistributed;
    }

    function finalize() internal override{
        super.finalize();
    
        emit AuctionFinished(block.timestamp, currentRate);
    
    }

    function withDraw()  external stateUpdate() isFinished() {    //Users can withdraw their tokens if the auction is finished


        //This function may cause loss of some sucoins (owner gets more coins then needed)

        uint userDepositAmount = biddingBook[msg.sender];
        require(userDepositAmount > 0, "You don't have any tokens to withdraw");
        biddingBook[msg.sender] = 0;
       

        //Send tokens to buyer
        projectToken.transfer(msg.sender, (userDepositAmount * 10 ** projectToken.decimals()) / currentRate);
    
    }

    
    function tokenBuyLogic(uint bidCoinBits) internal virtual override {
            biddingBook[msg.sender] += bidCoinBits;
            totalDepositedSucoins += bidCoinBits;
            setCurrentRate();


        }


    function setCurrentRate() internal virtual {
        currentRate =   totalDepositedSucoins * (10 ** projectToken.decimals()) / numberOfTokensToBeDistributed;
    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {

        
        require(bidCoinBits >= (currentRate / (10 ** projectToken.decimals())),"Bidcoin amount lower than required to buy a token");
        swap(bidCoinBits);    

      

    
    } 
    


   




}

