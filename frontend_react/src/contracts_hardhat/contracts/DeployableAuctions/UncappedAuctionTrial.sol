pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "contracts/AuctionTrial.sol";
import "contracts/ERC20Mintable.sol";



contract UncappedAuctionTrial is AuctionTrial {
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
        AuctionTrial(_bidCoin)
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

    function swap(address buyer,uint bidCoinBits,uint projectTokenBits) private {
        
      
       

        //Check if buyer has approved this contracts bid coin usage

       uint allowance = bidCoin.allowance(buyer,address(this));
      
       require(allowance >= bidCoinBits,"Approved bid coin amount is not enough");

        //Check and process if buyer have the coins to do the swap


      
        bidCoin.transferFrom(buyer, owner(), bidCoinBits);
        //Send project tokens to buyer
       //No need for approval from the contracts side
    

       projectToken.mint(buyer , projectTokenBits);
       soldProjectTokens += projectTokenBits;


        
        emit TokenBought(buyer, bidCoinBits, projectTokenBits);


    }

    function withDraw() external onlyOwner {  //Must be used by owner if your coins not bought prior to ending time and no one tried bidding after ending time
        require(status == AuctionStatus.RUNNING,"Auction is not active");
        require(block.timestamp >= latestEndTime,"Until auction time ends you can not withdraw your tokens");
        finalize();
    }


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {
        swap(msg.sender,bidCoinBits, (bidCoinBits / rate) * 10 ** projectToken.decimals());

    }



    function auctionStartCheckConditions(uint maximumAuctionTimeInHours ) internal virtual override {
        super.auctionStartCheckConditions(maximumAuctionTimeInHours);

        //Contract needs to be minter for uncapped auction
        require(projectToken.hasRole(MINTER_ROLE, address(this)), "Contract does not have the minter permission to start the auction");
    }

  
}

