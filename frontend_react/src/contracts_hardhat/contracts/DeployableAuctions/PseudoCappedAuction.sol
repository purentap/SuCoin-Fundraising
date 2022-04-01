pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/AbstractAuctions/CappedTokenAuction.sol";


//This is a contract with fixed token supply but has unlimited sucoin allocation (until the time ends) then tokens are distrubted 
//with regars to sucoin holdings
//There is good chance users will get less than normal amount for their sucoin using this auction

contract PseudoCappedAuctionTrial is CappedTokenAuction {


    uint public currentRate;
    uint public totalDepositedSucoins;


    mapping (address => uint) public biddingBook;  //Orderbook



    //Maestro public maestroSCa;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _numberOfTokensToBeDistributed
         )
        CappedTokenAuction(_token,_bidCoin,_numberOfTokensToBeDistributed)
        {

            soldProjectTokens = _numberOfTokensToBeDistributed;


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
        projectToken.transfer(msg.sender, userDepositAmount / currentRate);
    
    }

    
    function tokenBuyLogic(uint bidCoinBits) internal virtual override {
            biddingBook[msg.sender] += bidCoinBits;
            totalDepositedSucoins += bidCoinBits;
            setCurrentRate();


        }


    //In a normal capped auction rate is constant so this function does nothing
    function setCurrentRate() internal virtual {
        currentRate =   numberOfTokensToBeDistributed / totalDepositedSucoins;
    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {

        
        require(bidCoinBits >= currentRate,"Bidcoin amount lower than required to buy a token");
        swap(bidCoinBits);    

      

    
    } 
    


   




}

