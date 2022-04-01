pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/AbstractAuctions/Auction.sol";
import "contracts/ERC20Mintable.sol";



contract UncappedAuction is Auction {
    ERC20Mintable public projectToken;                                         //Auctioned coin
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");            //Constant for checking minter role


    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction
    uint public rate;                                                         //How much a  bid coin bit worth project token  bids


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens


    
    //Maestro public maestroSCa;
    constructor(
        address _token, 
        address _bidCoin, 
        uint _rate

         )
        Auction(_bidCoin)
        {

      
        projectToken = ERC20Mintable(_token);
        require(_rate >= 1,"1 Token should at least worth 1 sucoin bits");
        rate = _rate;

    }

    function finalize() internal override{
        super.finalize();

        //Emits total sold project tokens when auction finishes
        emit AuctionFinished(block.timestamp, soldProjectTokens);
    
    }

    function tokenBuyLogic(uint bidCoinBits) internal virtual override {
            uint boughtTokens = bidCoinBits / rate;

            projectToken.mint(msg.sender , boughtTokens);
            soldProjectTokens += boughtTokens;


        
            emit TokenBought(msg.sender, bidCoinBits, boughtTokens);
        }


 

 

   


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {
        bidCoinBits = handleRemainder(bidCoinBits, rate);

        swap(bidCoinBits);

    }



    function auctionStartCheckConditions(uint maximumAuctionTimeInHours ) internal virtual override {
        super.auctionStartCheckConditions(maximumAuctionTimeInHours);

        //Contract needs to be minter for uncapped auction
        require(projectToken.hasRole(MINTER_ROLE, address(this)), "Contract does not have the minter permission to start the auction");
    }

  
}

