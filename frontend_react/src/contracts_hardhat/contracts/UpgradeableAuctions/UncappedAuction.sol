pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./Auction.sol";
import "../UpgradeableTokens/ERC20MintableBurnableUpgradeable.sol";



contract UncappedAuction is Auction {
    ERC20MintableBurnableUpgradeable public projectToken;                                         //Auctioned coin
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");            //Constant for checking minter role


    uint public soldProjectTokens;                                  
    uint public numberOfTokensToBeDistributed;                                //Total coin amount owner wants to auction
    uint public rate;                                                         //How much a  bid coin bit worth project token  bids


    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens


    
    

     function initialize(auctionParameters calldata params) override initializer public {
        __Auction_init(params);
        __UncappedAuction_init_unchained(params);

    }

    function __UncappedAuction_init_unchained(auctionParameters calldata params) internal onlyInitializing{
        projectToken = ERC20MintableBurnableUpgradeable(params.token);
        rate = params.rate;
    }


    function finalize() internal override{
        super.finalize();

        //Remove contracts mint permission
        projectToken.renounceRole(MINTER_ROLE, address(this));

        //Emits total sold project tokens when auction finishes
        emit AuctionFinished(block.timestamp, soldProjectTokens);
    
    }

    function tokenBuyLogic(uint bidCoinBits) internal virtual override {
            uint boughtTokens = (bidCoinBits * (10 ** projectToken.decimals())) / rate;

            projectToken.mint(msg.sender , boughtTokens);
            soldProjectTokens += boughtTokens;


        
            emit TokenBought(msg.sender, bidCoinBits, boughtTokens);
        }


 

 

   


    function handleValidTimeBid(uint bidCoinBits) internal virtual override {
        bidCoinBits = handleRemainder(bidCoinBits, rate);
        require(bidCoinBits >= (rate / (10 ** projectToken.decimals())),"Bidcoin amount lower than required to buy a token");

        swap(bidCoinBits);

    }



    function auctionStartCheckConditions(uint maximumAuctionTimeInHours ) internal virtual override {
        super.auctionStartCheckConditions(maximumAuctionTimeInHours);

        //Contract needs to be minter for uncapped auction
        require(projectToken.hasRole(MINTER_ROLE, address(this)), "Contract does not have the minter permission to start the auction");
    }

  
}

