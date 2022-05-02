pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./PseudoCappedAuction.sol";
import "../libraries/BokkyPooBahsRedBlackTreeLibrary.sol";

//This is a contract with fixed token supply but has unlimited sucoin allocation (until the time ends) then tokens are distrubted 
//with regars to sucoin holdings
//There is good chance users will get less than normal amount for their sucoin using this auction

contract OBDutchAuction is PseudoCappedAuction {

    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;
    address public proposerWallet;

    uint public minPrice;
    uint public minPriceTokenCount;

   BokkyPooBahsRedBlackTreeLibrary.Tree private tree;

    struct UserOrder{
        uint deposit;
        uint price;
        uint available;
    }

    struct PriceOrders {
        address[] userAddresses;
        uint totalWanted;
    }

    mapping(address => UserOrder) public UserOrders;
    mapping(uint => PriceOrders) public ordersForPrice;
   

    function initialize(auctionParameters calldata params)  override initializer public {
        __CappedTokenAuction_init(params);
        __OBDutchAuction_init_unchained();
    }

    function __OBDutchAuction_init_unchained() internal onlyInitializing {
        projectWallet = address(this);
    }

    function setTeamWallet(address wallet) override external virtual onlyRole(PROPOSER_ADMIN_ROLE) {
        proposerWallet = wallet;
    }

    function bid(uint bidCoinBits,uint price)  external  virtual stateUpdate() isRunning()  {


         require(bidCoinBits >= 0, "You need to bid some coins");

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits,price);
     }

     function handleValidTimeBid(uint bidCoinBits) internal virtual override {  
        handleValidTimeBid(bidCoinBits,minPrice);
    } 

    function handleValidTimeBid(uint bidCoinBits,uint price) internal virtual  {  

        require(price >= minPrice,"You need to enter a higher price");

        UserOrders[msg.sender].price = price;

        bidCoinBits =  handleRemainder(bidCoinBits, price);
    } 


    function tokenBuyLogic(uint bidCoinBits) internal virtual override {

            uint price =  UserOrders[msg.sender].price;
            UserOrders[msg.sender].deposit = bidCoinBits;
            PriceOrders storage orders = ordersForPrice[price];

            if (orders.userAddresses.length < 0 && (price >= minPrice)) 
                tree.insert(price);
            

            orders.userAddresses.push(msg.sender);
            orders.totalWanted += bidCoinBits / price;

            
            totalDepositedSucoins += bidCoinBits;
            setCurrentRate();
        }


    function setCurrentRate() internal virtual override {   //Todo performance could be improved
        currentRate = tree.last();


        //Min Price part
        uint remainingTokens = numberOfTokensToBeDistributed;
        uint tempRate;

        for (tempRate = currentRate;  (remainingTokens > ordersForPrice[tempRate].totalWanted) && (tempRate != 0); tempRate = tree.prev(tempRate)) 
           remainingTokens -= ordersForPrice[tempRate].totalWanted;

        if (tempRate == 0) 
            soldProjectTokens = numberOfTokensToBeDistributed - remainingTokens;
        
        else {
            soldProjectTokens = numberOfTokensToBeDistributed;
            minPriceTokenCount = remainingTokens;
        }
        
        minPrice = tempRate + 1;     
    }

    function withDraw()  external stateUpdate() isFinished() override {    //Users can withdraw their tokens if the auction is finished


        //This function may cause loss of some sucoins (owner gets more coins then needed)

        UserOrder storage userOrder = UserOrders[msg.sender];
        require(userOrder.deposit > 0,"You already withdrew or your token distributed already");

        uint price = userOrder.price;
        uint tokenAmount = userOrder.deposit / price;
        uint cost = tokenAmount * (minPrice - 1);


        //Higher or equal to minPrice gets the full order
        if (price >= minPrice)  {

            //Send tokens
             projectToken.transfer(msg.sender,userOrder.deposit / price);


             //Refund to user and remaining goes to proposer
             bidCoin.transfer(msg.sender, userOrder.deposit - cost);
             bidCoin.transfer(proposerWallet, cost);
        }

        //If users price is lower than minPrice - 1  they don't  get any tokens

        else if (price < minPrice - 1) {
            bidCoin.transfer(msg.sender,userOrder.deposit);
        }


        //At min price -1 some get all the tokens  some get nothing while one person gets somewhat 
        else {
            uint availableToken = userOrder.available < tokenAmount ? userOrder.available : tokenAmount;

 
            if (availableToken != 0) {
                projectToken.transfer(msg.sender,availableToken);
                bidCoin.transfer(proposerWallet,availableToken * (price));
            }

            if (availableToken != tokenAmount) 
                bidCoin.transfer(msg.sender, (tokenAmount - availableToken)  * price);
            

        }
        delete UserOrders[msg.sender];
      
    }

    function finalize() internal override{

        super.finalize();

        if (minPriceTokenCount != 0) {
            uint tempCount = minPriceTokenCount;
            address[] storage priceAddreses = ordersForPrice[(minPrice-1)].userAddresses;

            for (uint i = 0; i < priceAddreses.length; i++) {
                UserOrder storage userOrder = UserOrders[priceAddreses[i]];
                uint wantedTokenAmount = userOrder.deposit / userOrder.price;

                if (tempCount < wantedTokenAmount) {
                    userOrder.available = tempCount;
                    break;
                }

                userOrder.available = wantedTokenAmount;
                tempCount -= wantedTokenAmount;
                
            }
        }
    }
}

