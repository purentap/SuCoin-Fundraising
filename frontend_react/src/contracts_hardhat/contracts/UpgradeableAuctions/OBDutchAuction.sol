pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "./PseudoCappedAuction.sol";
//Liblary of tree for sorting and binary searching orders
import "../libraries/BokkyPooBahsRedBlackTreeLibrary.sol";

/*

    This auction type has specific amount of tokens to be auctioned.
    In this auction users can enter their price for each token when bidding
    Users can only  bid  once and it can't be removed.

    If there is more bids than tokens to be auctioned, then the bids are sorted by price.
    So lower bids may not get any tokens
    Lowest possible price is stored through the auction which may increase
    Users cannot bid below minimum price


    Auction ends when time is up.
    Token price will be the price where lowest price which can get tokens when sorted.
    Users can withdraw their tokens (or sucoins if their bid was below the minimum price)

    Gas cost wise this auction is not the best as it uses a lot of gas for sorting and storing bids
    But it is close to original dutch auction
    
    todo: add incremenets instead of increasing 1 increase by increment amount

*/

contract OBDutchAuction is PseudoCappedAuction {

    //Tree for orderbook
    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;
    address public proposerWallet;

    uint public minPrice;
    //How many tokens are excessive on minimum price
    uint internal minPriceTokenCount;

   BokkyPooBahsRedBlackTreeLibrary.Tree private tree;


    //Keeps track of the  individual user bids and how full they are
    struct UserOrder{
        uint deposit;
        uint price;
        uint available;
    }

    //Keeps track of bids in a particular price
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


    //Auction money does not go to the project wallet as bid reverts can happen
    //Instead it goes when people withdraw their tokens
    //todo Find a better way as there is a chance users never withdraw their tokens

    function setTeamWallet(address wallet) override external virtual onlyRole(PROPOSER_ADMIN_ROLE) {
        proposerWallet = wallet;
    }

    //Bid function with custom price 

    function bid(uint bidCoinBits,uint price)  external  virtual stateUpdate() isRunning()  {


         require(bidCoinBits > 0, "You need to bid some coins");

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits,price);
     }


     //Min price is chosen if user did not enter a custom bid price

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

    //Used to clear any bids below the minimum price when minimum price is updated
    function clearTree(uint tempRate) private {
        while(tree.first() != tempRate) {
                uint prevValue = tree.prev(tempRate);
                tree.remove(prevValue);
                delete ordersForPrice[prevValue];
            }
    }


    //Gets the price of the lowest bid which can get tokens when sorted (may change when new bids happen)
    //todo fix this
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

            //First bid for this price
            if (orders.userAddresses.length == 0) 
                tree.insert(price);
            

            //How many tokens wanted in this price
            orders.userAddresses.push(msg.sender);
            uint amount = convertPrice(bidCoinBits,address(projectToken)) / price;
            orders.totalWanted += amount;

            if (soldProjectTokens != numberOfTokensToBeDistributed) {
                //Less bids than total token count
                uint total = soldProjectTokens + amount;
                
                //If with current order bids ar higher than total token count update minimum price
                if (total >= numberOfTokensToBeDistributed) 
                    tempMinPrice = getMinPrice(total - numberOfTokensToBeDistributed);

                //Sold project tokens can't be higher than number of tokens to be distributed
                soldProjectTokens = total >= numberOfTokensToBeDistributed ? numberOfTokensToBeDistributed : total;
                
                
            }
            else  {
                //All tokens are alaready bidded
                uint total = minPriceTokenCount + amount;
                tempMinPrice = getMinPrice(total);
                /
            }

            //Emit event for frontend usage
            if (tempMinPrice != minPrice) {
                emit VariableChange("minPrice", tempMinPrice);
                minPrice = tempMinPrice;
            }

       
            totalDepositedSucoins += bidCoinBits;
            setCurrentRate();
        }

     

    
    //Last element in tree is the highest bid price which is what used as current rate
    function getCurrentRate() public virtual view override returns(uint current) {      //todo bad performance
        return tree.last();
    }


    //Withdrawal has 3 probabilities
    //1. Bid was above minimum bid - user uses all sucoins for getting tokens 
    //2. Bid was minimum bid - explained inside withdraw function
    //3. Bid was below minimum bid - user gets their sucoin refunded

    //Users can withdraw their tokens if the auction is finished

    function withDraw()  external quietStateUpdate() isFinished() override {    


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
                //This means everyone gets the tokens
                projectToken.transfer(msg.sender,tokenAmount);
                bidCoin.transfer(proposerWallet, userOrder.deposit);
            }
            
            else {

                //Not everyone gets the tokens

            if (availableToken != 0) {
                //Send some amount of tokens to user
                projectToken.transfer(msg.sender,availableToken);
                bidCoin.transfer(proposerWallet,revertPrice(availableToken * (price),address(projectToken)));
            }


            if (availableToken != tokenAmount) 
                //Refund some sucoins to user
                bidCoin.transfer(msg.sender, revertPrice((tokenAmount - availableToken) * price,address(projectToken)));

            }
            

        }
        //Delete user order
        delete UserOrders[msg.sender];
      
    }

    function finalize() internal override{

        super.finalize();

        //If minPriceTokenCount is 0  every remaining bidders gets their tokens
        if (minPriceTokenCount != 0) {
            //Distribute tokens to min bidders through their bidding time (earlier gets first)
            PriceOrders storage minOrders = ordersForPrice[minPrice-1];

            //Remaining tokens for min biidders
            uint tempCount =  minOrders.totalWanted - minPriceTokenCount;

            address[] storage priceAddreses = minOrders.userAddresses;

            for (uint i = 0; i < priceAddreses.length; i++) {
                //Distribute tokens from the beginning
                UserOrder storage userOrder = UserOrders[priceAddreses[i]];
                uint wantedTokenAmount =  convertPrice(userOrder.deposit,address(projectToken)) / userOrder.price;

                //One person does not get full tokens instead he is refunded some of his bidcoin
                if (tempCount < wantedTokenAmount) {
                    userOrder.available = tempCount;
                    //Addresses after this address won't get any tokens
                    break;
                }

                //Get the full token amount without refund of bidcoin

                userOrder.available = wantedTokenAmount;
                tempCount -= wantedTokenAmount;
            }

            
        }

        //Clear the remaining tree
        uint current;
        while((current = tree.first()) != 0) {
                tree.remove(current);
                delete ordersForPrice[current];
        }
        //Get current rate should return minPrice - 1
        tree.insert(minPrice - 1);
        
    }
}

