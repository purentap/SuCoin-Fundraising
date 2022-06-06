pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "@openzeppelin/contracts/utils/Multicall.sol";



import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";


import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "../WrapperToken.sol";


/*
    Auction is the base abstract auction for all deployable auction types
    It is an upgradeable contract, because auctions are created through minimal proxy contracts
    Which also means it uses initializers insttead of constructors

    Parent child relationship used because it is easier to manage and create similar auctions like dutch and strictDutch
    Also useful for frontend as it can just use auction contracts as base contract if it is a property existing in base contract

    It has common functions like swaping,bidding,pausing,finalizing
    It has common events like auctionStarted,auctionFinished,tokenBought
    It has common variables like auctionStartTime,auctionEndTime,soldProjectTokens and getters for them to be used in frontend

    


*/

abstract contract Auction is AccessControlUpgradeable,Multicall  {                       //Abstract Contract for all auction types

    WrapperToken public bidCoin;                                          //Coin used for buying auction coins (Sucoin)
    uint public startTime;                                                    //Auction Start time in timestamp
    uint  public latestEndTime;                                               //Latest Auction end time in timestamp

    uint internal variableStartTime;                                          //Pause support

    enum AuctionStatus{OFF,RUNNING,PAUSED,ENDED} 
    AuctionStatus public status;                                              //Current status of the auction       


    //Proposers are the people who are from project team who are proposing the project
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    //Proposer admin is proposer who created the auction and he can add new proposers
    bytes32 public constant PROPOSER_ADMIN_ROLE = keccak256("PROPOSER_ADMIN_ROLE");
    
    //Where the money from the auction is going to be sent
    address public projectWallet;

    //Total sucoin funds in the auction
    uint public totalDepositedSucoins;

                     


    event BidSubmission(address indexed sender, uint amount);              //Logs bidder and bid amount in bidCoin
    event AuctionFinished(uint end, uint finalPrice);                         //Logs ending time and final price of the coin 
    event AuctionStarted(uint start, uint end);                               //Logs beginning and latest ending time of an auction
    event AuctionPaused(uint pauseDuration);                                  //Logs pause duration
    event VariableChange(string variable,uint value);                         //Logs variable change used for charting



                                                                              //Gets and sets auction information


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(auctionParameters calldata params)  public virtual;
 
    function __Auction_init(auctionParameters calldata params) internal  onlyInitializing{
        __AccessControl_init();

       

        __Auction_init_unchained(params);
    }


    function __Auction_init_unchained(auctionParameters calldata params) internal onlyInitializing {
         _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
         

        _setRoleAdmin(PROPOSER_ROLE, PROPOSER_ADMIN_ROLE);

        _grantRole(PROPOSER_ADMIN_ROLE,msg.sender);
   

        status = AuctionStatus.OFF;
        
        bidCoin = WrapperToken(params.bidCoin);
    }

    //Proposer admins can change the project wallet
    function setTeamWallet(address wallet) virtual external  onlyRole(PROPOSER_ADMIN_ROLE) {
        projectWallet = wallet;
    }


    //Default admin role is not proposer admin but maestro contract itself which can be called by actual admins of the whole system
     function forcedManualFinish() public onlyRole(DEFAULT_ADMIN_ROLE) {
         require(status != AuctionStatus.ENDED,"This Auction already ended");
         finalize();
     }


    //Parameters are send as struct  because of parameter limit on solidity
   struct auctionParameters {
       address token;
       address bidCoin;
       uint numberOfTokensToBeDistributed;
       uint rate;
       uint finalRate;
       uint limit;
    }


    //Auction cannot finish itself if there is no user interaction with the auction so this functions just finishes it if time is up
     function manualFinish() public  quietStateUpdate() isFinished(){}


    //Updates the auction status (can be changed by time) and finalizes if time is up
    //Does not continue with the function is it finalizes
   modifier stateUpdate() {
        if (status == AuctionStatus.PAUSED  && block.timestamp >= variableStartTime)
            status = AuctionStatus.RUNNING;
        if (status == AuctionStatus.RUNNING && block.timestamp >= latestEndTime)
            finalize();
        else
        _;
    }

    //Very similar to stateUpdate but continues with the function even if time is up
    //As there are some functions which can be called only after auction is ended (withDraw)
    modifier quietStateUpdate() {
        if (status == AuctionStatus.PAUSED  && block.timestamp >= variableStartTime)
            status = AuctionStatus.RUNNING;
        if (status == AuctionStatus.RUNNING && block.timestamp >= latestEndTime)
            finalize();
        _;
          
    }

    modifier isFinished() {
        require(status == AuctionStatus.ENDED,"Auction has not finished yet");
        _;
    }  

    modifier isRunning() {
        require(status == AuctionStatus.RUNNING,"Auction is not running");
        _;

    }

    //Decimal mathematics to fake represent floating numbers

       function revertPrice(uint formattedAmount,address token) internal virtual view returns(uint) {
             return formattedAmount / 10 ** ERC20(token).decimals();
        }

        function convertPrice(uint normalAmount,address token) internal virtual view returns(uint){
            return normalAmount * 10 ** ERC20(token).decimals();
        }


    //Removes the remaining bidCoins from further calculations
    //Example if you have 5 bidcoins and rate is 1 token - 3 bidcoins then you will have 2 bidcoins remaining
    //This function just returns 3 for further calculations
 function handleRemainder(uint bidCoinBits,uint currentRate) internal virtual returns (uint) {
       
        uint remainder = bidCoinBits -  revertPrice((convertPrice(bidCoinBits,address(bidCoin)) / currentRate) * currentRate,address(bidCoin));
        return bidCoinBits - remainder;

    }

    function auctionStartCheckConditions(uint maximumAuctionTimeInHours) internal virtual {
        require(status == AuctionStatus.OFF,"Auction already started or already ended");
        require(maximumAuctionTimeInHours > 0,"Auction Time must be longer");
    }

    //Only proposers can start the auction
    function startAuction(uint maximumAuctionTimeInHours) public virtual onlyRole(PROPOSER_ROLE) {
        
   
        auctionStartCheckConditions(maximumAuctionTimeInHours);

        //Start the auction
        status = AuctionStatus.RUNNING;
        startTime = block.timestamp;
        latestEndTime = block.timestamp + maximumAuctionTimeInHours * 1 seconds;        //seconds instead of hours for test purposes
 
        emit AuctionStarted(startTime,latestEndTime);
    
    }

    //Only general admins can pause an auctions as proposer admins can pause infintely if they are malicious
    function pauseAuction(uint pauseTimeInHours) public virtual stateUpdate() onlyRole(DEFAULT_ADMIN_ROLE)  isRunning() {
        require(pauseTimeInHours > 0,"Pause Time must be longer");
        //Seconds for easier testing can be changed to hours later
        variableStartTime = block.timestamp + pauseTimeInHours * 1 seconds;
        latestEndTime = variableStartTime + latestEndTime - block.timestamp;
        status = AuctionStatus.PAUSED;
        emit AuctionPaused(pauseTimeInHours);
    }

    //For more complex finalization other auctions override this function
    function finalize() internal virtual  {                                                     
        status = AuctionStatus.ENDED;
    }

    
    
    function getStatus() external view returns(AuctionStatus){
        AuctionStatus stat = status;
        if (status == AuctionStatus.PAUSED  && block.timestamp >= variableStartTime)
            stat = AuctionStatus.RUNNING;
        if (status == AuctionStatus.RUNNING && block.timestamp >= latestEndTime)
            stat = AuctionStatus.ENDED;
        return stat;
    }

    //To be overrided by child contracts
    function handleValidTimeBid(uint bidCoinBits) internal virtual;


    //Basic check like time and wallet owner 
     function bid(uint bidCoinBits)  public  virtual stateUpdate() isRunning() {


         require(projectWallet != address(0),"Project wallet is not set");

         require(msg.sender != projectWallet,"Project wallet cannot bid");

         require(!hasRole(PROPOSER_ROLE,msg.sender),"Proposers cannot bid");


         require(bidCoinBits > 0, "You need to bid some coins");

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits);
     }

    //To be overrided by child contracts
     function tokenBuyLogic(uint bidCoinBits) internal virtual;



    //Sends the bidcoins to the project wallet
    //Tokens can be obtained instantly if the auction does not use orderbooks
    //If it uses orderbooks it will be added to the orderbook and tokens will be withdrawn after the auction is finished
     function swap(uint bidCoinBits) internal virtual {
        
      
       

        //Check if buyer has approved this contracts bid coin usage

       uint allowance = bidCoin.allowance(msg.sender,address(this));
      
       require(allowance >= bidCoinBits,"Approved bid coin amount is not enough");



        //Check and process if buyer have the coins to do the swap

       bidCoin.transferFrom(msg.sender, projectWallet, bidCoinBits);

       totalDepositedSucoins += bidCoinBits;
       
       emit VariableChange("totalDepositedSucoins", totalDepositedSucoins);

        //Send project tokens to buyer
       //No need for approval from the contracts side

       tokenBuyLogic(bidCoinBits);
       


    }
  

    
}

