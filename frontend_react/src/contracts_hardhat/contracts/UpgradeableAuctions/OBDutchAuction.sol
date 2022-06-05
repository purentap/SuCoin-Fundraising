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
    uint internal minPriceTokenCount;

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
        minPrice = 1;
    }

    function setTeamWallet(address wallet) override external virtual onlyRole(PROPOSER_ADMIN_ROLE) {
        proposerWallet = wallet;
    }

    function bid(uint bidCoinBits,uint price)  external  virtual stateUpdate() isRunning()  {


         require(bidCoinBits > 0, "You need to bid some coins");

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits,price);
     }

     function handleValidTimeBid(uint bidCoinBits) internal virtual override {  
        handleValidTimeBid(bidCoinBits,minPrice);
    } 

    function handleValidTimeBid(uint bidCoinBits,uint price) internal virtual  {  

        require(price >= minPrice,"You need to enter a higher price");

        UserOrder storage userOrder = UserOrders[msg.sender];

        require(userOrder.price == 0, "You have already bid");

        userOrder.price = price;

        bidCoinBits =  handleRemainder(bidCoinBits, price);

        require(bidCoinBits > 0, "You need to put more bidcoins");

        swap(bidCoinBits);
    } 

    function clearTree(uint tempRate) private {
        while(tree.first() != tempRate) {
                uint prevValue = tree.prev(tempRate);
                tree.remove(prevValue);
                delete ordersForPrice[prevValue];
            }
    }

    function getMinPrice(uint total) private returns(uint){
        uint value;

         for (value = tree.first(); total >= ordersForPrice[value].totalWanted; value = tree.next(value)) 
                    total -= ordersForPrice[value].totalWanted; 

        minPriceTokenCount = total;
         clearTree(value);
        return value + 1;
    }


    function tokenBuyLogic(uint bidCoinBits) internal virtual override {

            uint price =  UserOrders[msg.sender].price;
            UserOrders[msg.sender].deposit = bidCoinBits;
            PriceOrders storage orders = ordersForPrice[price];
            uint tempMinPrice = minPrice;

            if (orders.userAddresses.length == 0) 
                tree.insert(price);
            

            orders.userAddresses.push(msg.sender);
            uint amount = convertPrice(bidCoinBits,address(projectToken)) / price;
            orders.totalWanted += amount;

            if (soldProjectTokens != numberOfTokensToBeDistributed) {
                uint total = soldProjectTokens + amount;

                if (total >= numberOfTokensToBeDistributed) 
                    tempMinPrice = getMinPrice(total - numberOfTokensToBeDistributed);

                soldProjectTokens = total >= numberOfTokensToBeDistributed ? numberOfTokensToBeDistributed : total;
                
                
            }
            else  {
                uint total = minPriceTokenCount + amount;
                tempMinPrice = getMinPrice(total);
            }

            if (tempMinPrice != minPrice) {
                emit VariableChange("minPrice", tempMinPrice);
                minPrice = tempMinPrice;
            }

       
            totalDepositedSucoins += bidCoinBits;
            setCurrentRate();
        }

     

    
    function getCurrentRate() public virtual view override returns(uint current) {      //todo bad performance
        return tree.last();
    }



    function withDraw()  external quietStateUpdate() isFinished() override {    //Users can withdraw their tokens if the auction is finished


        //This function may cause loss of some sucoins (owner gets more coins then needed)

        UserOrder storage userOrder = UserOrders[msg.sender];
        require(userOrder.deposit > 0,"You already withdrew or your token distributed already");

        uint price = userOrder.price;
        uint tokenAmount = convertPrice(userOrder.deposit,address(projectToken))  / price;
        uint cost =  revertPrice(tokenAmount * (minPrice - 1),address(projectToken));


        //Higher or equal to minPrice gets the full order
        if (price >= minPrice)  {

            //Send tokens
             projectToken.transfer(msg.sender,tokenAmount);


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

            if (minPriceTokenCount == 0) {
             projectToken.transfer(msg.sender,tokenAmount);
             bidCoin.transfer(proposerWallet, userOrder.deposit);
            }
            
            else {

            if (availableToken != 0) {
                projectToken.transfer(msg.sender,availableToken);
                bidCoin.transfer(proposerWallet,revertPrice(availableToken * (price),address(projectToken)));
            }

            if (availableToken != tokenAmount) 
                bidCoin.transfer(msg.sender, revertPrice((tokenAmount - availableToken) * price,address(projectToken)));

            }
            

        }
        delete UserOrders[msg.sender];
      
    }

    function finalize() internal override{

        super.finalize();

        if (minPriceTokenCount != 0) {
            PriceOrders storage minOrders = ordersForPrice[minPrice-1];
            uint tempCount =  minOrders.totalWanted - minPriceTokenCount;
            address[] storage priceAddreses = minOrders.userAddresses;

            for (uint i = 0; i < priceAddreses.length; i++) {
                UserOrder storage userOrder = UserOrders[priceAddreses[i]];
                uint wantedTokenAmount =  convertPrice(userOrder.deposit,address(projectToken)) / userOrder.price;

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

