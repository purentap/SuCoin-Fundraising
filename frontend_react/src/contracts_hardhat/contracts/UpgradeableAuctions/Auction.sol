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



abstract contract Auction is AccessControlUpgradeable,Multicall  {                       //Abstract Contract for all auction types

    WrapperToken public bidCoin;                                          //Coin used for buying auction coins (Sucoin)
    uint public startTime;                                                    //Auction Start time in timestamp
    uint  public latestEndTime;                                               //Latest Auction end time in timestamp
    enum AuctionStatus{OFF,RUNNING,ENDED} 
    AuctionStatus public status;                                              //Current status of the auction         
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant PROPOSER_ADMIN_ROLE = keccak256("PROPOSER_ADMIN_ROLE");

    address public projectWallet;

                     


    event BidSubmission(address indexed sender, uint amount);              //Logs bidder and bid amount in bidCoin
    event AuctionFinished(uint end, uint finalPrice);                         //Logs ending time and final price of the coin 
    event AuctionStarted(uint start, uint end);                               //Logs beginning and latest ending time of an auction


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

    function setTeamWallet(address wallet) external  onlyRole(PROPOSER_ADMIN_ROLE) {
        projectWallet = wallet;
    }


   struct auctionParameters {
       address token;
       address bidCoin;
       uint numberOfTokensToBeDistributed;
       uint rate;
       uint finalRate;
       uint limit;
    }

     function manualFinish() public  stateUpdate() isFinished(){}



   modifier stateUpdate() {
        if (status == AuctionStatus.RUNNING && block.timestamp >= latestEndTime)
            finalize();
        else
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

   function handleRemainder(uint bidCoinBits,uint currentRate) internal virtual returns (uint) {
        uint remainder = bidCoinBits -  (bidCoinBits / currentRate) * currentRate;
        return bidCoinBits - remainder;

    }

    function auctionStartCheckConditions(uint maximumAuctionTimeInHours) internal virtual {
        require(status == AuctionStatus.OFF,"Auction already started or already ended");
        require(maximumAuctionTimeInHours > 0,"Auction Time must be longer");
    }
                                                                            //Create the auction if the auction creator already deposited the coins or have given approval
    function startAuction(uint maximumAuctionTimeInHours) external virtual onlyRole(PROPOSER_ROLE) {
        
   
        auctionStartCheckConditions(maximumAuctionTimeInHours);

        //Start the auction
        status = AuctionStatus.RUNNING;
        startTime = block.timestamp;
        latestEndTime = block.timestamp + maximumAuctionTimeInHours * 1 seconds;        //seconds instead of hours for test purposes
 
        emit AuctionStarted(startTime,latestEndTime);
    
    }

    function finalize() internal virtual  {                                                     
        status = AuctionStatus.ENDED;
    }

    function handleValidTimeBid(uint bidCoinBits) internal virtual;



     function bid(uint bidCoinBits)  external  virtual stateUpdate() isRunning() {

        emit BidSubmission(msg.sender, bidCoinBits);

   
        handleValidTimeBid(bidCoinBits);
     }

     function tokenBuyLogic(uint bidCoinBits) internal virtual;

     function swap(uint bidCoinBits) internal virtual {
        
      
       

        //Check if buyer has approved this contracts bid coin usage

       uint allowance = bidCoin.allowance(msg.sender,address(this));
      
       require(allowance >= bidCoinBits,"Approved bid coin amount is not enough");



        //Check and process if buyer have the coins to do the swap

       bidCoin.transferFrom(msg.sender, projectWallet, bidCoinBits);

        //Send project tokens to buyer
       //No need for approval from the contracts side

       tokenBuyLogic(bidCoinBits);
       


    }
  

    
}

