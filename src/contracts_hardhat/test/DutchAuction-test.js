const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { before } = require("mocha");

function numberToBigNumber(amount,decimal) {
    return BigNumber.from(10).pow(decimal).mul(amount)
}




describe("Auction cases", () => {                                      

    //Signers of test accounts
    let owner,user1,user2

    //Addresses of test accounts
    let addrOwner,addr1,addr2


    //Sucoin info
    let sucoinDecimals,sucoinSupply,sucoin

    //Project Token info
    let projectTokenDecimals,projectTokenSupply,projectToken

    
    before(async () => {
        [owner,user1,user2] = await ethers.getSigners();
        [addrOwner,addr1,addr2] = await Promise.all([owner,user1,user2].map(async (signer) => signer.getAddress()));

        sucoinDecimals = 18                                              //Default erc20 value
        projectTokenDecimals = 18

        sucoinSupply = 1000                                            //Supply when you ignore decimals , changeable for different tests
        projectTokenSupply = 100000

    })

    beforeEach(async () => {
        const ERC = await ethers.getContractFactory("Token")

        //Deploy Sucoin
        sucoin = await ERC.deploy("Sucoin","SC",numberToBigNumber(sucoinSupply,sucoinDecimals),addrOwner)
        await sucoin.deployed()

        //Deploy Project Token

        projectToken  = await ERC.deploy("Project Token","TKN",numberToBigNumber(projectTokenSupply,projectTokenDecimals),addrOwner)
        await projectToken.deployed()


    })

    
    describe("Dutch Auction Cases",() => {

        let dutch,auctionedTokenAmount,auctionTimeInSeconds,initialRate,finalRate
        let Dutch;

        before(async () => {

            //These are default values but can be changed in specific tests

            //These rates are how much sucoin bits a token cost at the start and latest end of the auction
            initialRate = numberToBigNumber(1,sucoinDecimals-2)
            finalRate = numberToBigNumber(1,sucoinDecimals-3)

            auctionedTokenAmount = 10000
            auctionTimeInSeconds = 60
            
            Dutch = await ethers.getContractFactory("DutchAuctionTrial")
            

        })

        //Check if sucoin and project token addresses are valid
        beforeEach(async () => {
            expect(projectToken.address).to.be.properAddress;
            expect(sucoin.address).to.be.properAddress;
        })

        describe("Auction Creation",() => {
            it("Contract must not be deploy if number of token bits to be auctioned is 0",async () => {
                await expect(Dutch.deploy(projectToken.address,sucoin.address,0,initialRate,finalRate)).to.be.revertedWith('Auction cannot happen because there are no tokens to auction')
            })

            
            it("Contract must no be deployed if initial rate is < 1",async () => {
                await expect(Dutch.deploy(projectToken.address,sucoin.address,auctionedTokenAmount,0,finalRate)).to.be.revertedWith('1 Token should at least worth 1 sucoin bits')
            })

            it("Contract must no be deployed if final rate is higher tnan initial rate",async () => {
                await expect(Dutch.deploy(projectToken.address,sucoin.address,auctionedTokenAmount,1,10)).to.be.revertedWith('Final Rate must be lower or equal than Initial rate')
            })

            it ("Contract must be deployed correctly with default parameters",async () => {
                await expect(Dutch.deploy(projectToken.address,sucoin.address,auctionedTokenAmount,initialRate,finalRate)).to.not.be.reverted
            })
        })
        describe("Auction Start",() => {

            //Deploy the auction contract with default values
            beforeEach(async () => {
                dutch = await Dutch.deploy(projectToken.address,sucoin.address,numberToBigNumber(auctionedTokenAmount,projectTokenDecimals),initialRate,finalRate)
                await dutch.deployed();
            })


            

            //Starting action must be OnlyOwner action


            it("Non-Owners cannot start the auction",async () => {
                const dutchUser = await dutch.connect(user1)
                await expect(dutchUser.startAuction(auctionTimeInSeconds)).to.be.revertedWith('Ownable: caller is not the owner')
            })
            
            it("Owners who didn't approve or deposit needed tokens to contract cannot start the auction", async () => {


                //Assures no deposit or allowance
                expect(await projectToken.balanceOf(dutch.address)).to.be.equal(0)
                expect(await projectToken.allowance(addrOwner,dutch.address)).to.be.equal(0)

                
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.revertedWith('You need to approve or deposit more coins to auction contract')
            })

            it("Owners who approved or deposited less than number of tokens to be auctioned cannot start as well",async () => {
                const neededTokens = await dutch.numberOfTokensToBeDistributed()

                expect(await projectToken.balanceOf(addrOwner)).to.be.above(neededTokens)
                //Owner has more than enough tokens for auction

                await expect(projectToken.transfer(dutch.address,neededTokens.sub(2))).to.be.not.reverted;
                //Owner sends 2 less than needed amount

                await expect(projectToken.approve(dutch.address,1)).to.be.not.reverted
                //Owner approves usage of 1 token


                //Approve and deposit amount is less than needed tokens for auction
                expect(await dutch.numberOfTokensToBeDistributed())
                .to.be.above(BigNumber.from(await projectToken.balanceOf(dutch.address))
                                        .add(await projectToken.allowance(addrOwner,dutch.address)))


                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.revertedWith('You need to approve or deposit more coins to auction contract')

            })


            it("Owners who approved needed tokens but don't have them cannot start the auction",async () => {
                const ownerTokens = await projectToken.balanceOf(addrOwner)
                //Transfer all owner tokens to another account
                await projectToken.transfer(addr1,ownerTokens)

                //How many tokens auction need to start
                const neededTokens = BigNumber.from(await dutch.numberOfTokensToBeDistributed())

               
                await expect(projectToken.approve(dutch.address,neededTokens)).to.be.not.reverted
                expect(await projectToken.balanceOf(addrOwner)).to.be.below(neededTokens)
                //Owner approved all the needed tokens for auction but don't have them

                
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.revertedWith('ERC20: transfer amount exceeds balance')


                

            })

            it("Sucessfully started auction should fire an auctionStarted event",async () => {
                const neededTokens = BigNumber.from(await dutch.numberOfTokensToBeDistributed())

                //Owner sends 1 tokens to contract
                await expect(projectToken.transfer(dutch.address,1)).to.be.not.reverted;

                //Owner must have more than needed tokens
                expect(await projectToken.balanceOf(addrOwner)).to.be.above(neededTokens.sub(1))

                //Owner gives approval for the rest of the tokens
                await expect(projectToken.approve(dutch.address,neededTokens.sub(1))).to.be.not.reverted

                //Check if it emited (reverts cannot emit)
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.emit(dutch,"AuctionStarted")
            })

            it("Owners cannot start already ended or started auction",async () => {
                //Send the needed tokens
                await expect(projectToken.transfer(dutch.address,await projectToken.balanceOf(addrOwner))).to.be.not.reverted
                //Start auction once
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted

                //Second start must fail
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.revertedWith('Auction already started or already ended')

            })

            it("Auction time equal to 0 must fail",async () => {

                await expect(dutch.startAuction(0)).to.be.revertedWith('Auction Time must be longer')


            })



        })

        describe("Bidding",() => {

            //Contracts signed by non owner accounts
            let sucoinUser1,sucoinUser2
            let projectTokenUser1,projectTokenUser2
            let dutchUser1,dutchUser2

            let initialCoinUser1,initialCoinUser2

            let defaultBid

            before(async () => {
           
                //How much sucoin will users start
                initialCoinUser1 = 10
                initialCoinUser2 = 500
                defaultBid = numberToBigNumber(1,sucoinDecimals - 2) //10 ** -2 sucoin
            })


            beforeEach(async () => {
                //Create Auction from scratch 
                dutch = await Dutch.deploy(projectToken.address,sucoin.address,numberToBigNumber(auctionedTokenAmount,projectTokenDecimals),initialRate,finalRate)
                await dutch.deployed()



                //Send other accoutns sucoins to make them bid
                await expect(sucoin.transfer(addr1,numberToBigNumber(initialCoinUser1,sucoinDecimals))).to.be.not.reverted
                await expect(sucoin.transfer(addr2,numberToBigNumber(initialCoinUser2,sucoinDecimals))).to.be.not.reverted

                await expect(projectToken.transfer(dutch.address,await projectToken.balanceOf(addrOwner))).to.be.not.reverted


                //User signed contracts
                //Sucoin contracts
                sucoinUser1 = await sucoin.connect(user1)
                sucoinUser2 = await sucoin.connect(user2)
     
                //Project Token Contracts
                projectTokenUser1 = await projectToken.connect(user1)
                projectTokenUser2 = await projectToken.connect(user2)
     
                //Dutch Auction Contracts
                dutchUser1 = await dutch.connect(user1)
                dutchUser2 = await dutch.connect(user2)
            })

            it("Users cannot bid if auction is not started",async () => {
                await expect(dutch.bid(defaultBid)).to.be.revertedWith('Auction is not active')
            })

            it("Users who didn't approve their sucoins cannot bid", async () => {

                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted


                expect(await sucoin.allowance(addr1,dutch.address)).to.be.below(defaultBid)


                await expect(dutchUser1.bid(defaultBid)).to.be.revertedWith('Approved bid coin amount is not enough')
            })

            it("Users who approved the tokens but does not have them cannot bid", async () => {
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted


                const bigBid = defaultBid.mul(10000)                  //More than User1 has


                await expect(sucoinUser1.approve(dutch.address,bigBid.add(1))).to.be.not.reverted
                //User1 was able to approve while he don't have the needed coins

                await sucoinUser1.approve(dutch.address,bigBid.add(1))

                expect(await sucoin.allowance(addr1,dutch.address)).to.be.above(bigBid)
                //Allowed amount is more than what bigbid needs 

                await expect(dutchUser1.bid(bigBid)).to.be.revertedWith('ERC20: transfer amount exceeds balance')


            })

            it("Successful bids emit token bought event and increases the token count of bidder" , async() => {
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted

                //Beginning project token must be 0 because user didn't bought yet
                expect(await projectToken.balanceOf(addr2)).to.be.equal(0)

                //User has enough coins to approve and use
                await expect(sucoinUser2.approve(dutch.address,defaultBid)).to.be.not.reverted

                //Check if event is emitted
                await expect(dutchUser2.bid(defaultBid)).to.emit(dutch,"TokenBought")

                //Check if token count increased
                expect(await projectToken.balanceOf(addr2)).to.be.above(0)

            })

            it("If bidder has more coins than needed to buy all remaining tokens in the auction remaining part is refunded to him and auction finishes", async () => {
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted

                //Users all sucoins
                const allInBid = BigNumber.from(await sucoin.balanceOf(addr2))

                //Current token / sucoin bit rate
                const currentRate = BigNumber.from(await dutch.currentRate())

                //How many 
                const leftTokens =   BigNumber.from(await dutch.numberOfTokensToBeDistributed()).sub(await dutch.soldProjectTokens())
                
           

                //Check is users bid is worth more than all reamining tokens
                expect(allInBid).to.be.above(currentRate.mul(leftTokens).div(numberToBigNumber(1,projectTokenDecimals)))

                //Approve all
                await expect(sucoinUser2.approve(dutch.address,allInBid)).to.be.not.reverted


                //Check finish emission
                await expect(dutchUser2.bid(allInBid)).to.emit(dutch,"AuctionFinished")

                //Check if user have coins remaining 
                expect(await sucoin.balanceOf(addr2)).to.be.above(0)

                
            })


            //This test uses sleep so it is very slow
            it("Price should go from initial rate to final rate by time (decrease)",async () => {

                //Check this test by comparing how much token user buy with the same bit at different times
                await expect(dutch.startAuction(auctionTimeInSeconds)).to.be.not.reverted
                //Beginning project token must be 0 because user didn't bought yet

                expect(await projectToken.balanceOf(addr2)).to.be.equal(0)


                //User has enough coins to approve and use
                await expect(sucoinUser2.approve(dutch.address,defaultBid.mul(2))).to.be.not.reverted


                //Event must be emitted
                await expect(dutchUser2.bid(defaultBid)).to.emit(dutch,"TokenBought")
                
                //User must have bought some tokens Check if token count increased
                const boughtAmount = BigNumber.from(await projectToken.balanceOf(addr2))

                expect(boughtAmount).to.be.above(0)

                await new Promise(r => setTimeout(r, auctionTimeInSeconds * 100));        //sleep for tenth of auction time

                //Users buys with the same amount again
                await expect(dutchUser2.bid(defaultBid)).to.emit(dutch,"TokenBought")
                
                //User must have bought some tokens
                const boughtAmountAfterSleep = BigNumber.from(await projectToken.balanceOf(addr2)).sub(boughtAmount)


                //User must have bought around %10 more tokens for the same bid amount
                expect(boughtAmountAfterSleep.mul(100)).to.be.within(boughtAmount.mul(105),boughtAmount.mul(115))

            })

            it("When auction durations ends AuctionFinished event is emitted and users cannot bid anymore", async () => {

                //Edited auction time because test tooks so long otherwise
                const auctionTime = 1
                const auctionTimeInMS = auctionTime *  1000

            



                await expect(sucoinUser2.approve(dutch.address,defaultBid)).to.be.not.reverted

                await expect(dutch.startAuction(auctionTime)).to.be.not.reverted

                //Sleep for auctiontime
                await new Promise(r => setTimeout(r, auctionTimeInMS));


                //This user is first person interacting after the auctions and he is not reverted (need to fix)
                await expect(dutchUser2.bid(defaultBid)).to.emit(dutch,"AuctionFinished")

                //Later bids are reverted
                await expect(dutchUser2.bid(defaultBid)).to.be.revertedWith('Auction is not active')




            })
        }) 
            //Withdraw just calls finalize which actually does the coin redistribution
            describe("Withdrawal", () => {

                const testAuctionTime = 5
                const testActionTimeInMS = testAuctionTime *  1000

                beforeEach(async () => {
                    dutch = await Dutch.deploy(projectToken.address,sucoin.address,numberToBigNumber(auctionedTokenAmount,projectTokenDecimals),initialRate,finalRate)
                    await projectToken.approve(dutch.address,numberToBigNumber(auctionedTokenAmount,projectTokenDecimals))

                    await dutch.deployed()


                    dutchUser1 = dutch.connect(user1)
                    dutchUser2 = dutch.connect(user2)

                })

                it("Only owner can try to withdraw the remaining tokens",async () => {
                    await expect(dutchUser2.withDraw()).to.be.revertedWith('Ownable: caller is not the owner')

                });

                it("Owner can't withdraw if auction is already not active",async () => {

                    await expect(dutch.withDraw()).to.be.revertedWith('Auction is not active')

                });

                it("Owner can't withdraw if lates ending time of didn't come ",async () => {
           

                    await dutch.startAuction(testAuctionTime)


                    await expect(dutch.withDraw()).to.be.revertedWith('Until auction time ends you can not withdraw your tokens')

                });

                it("Owner can withdraw the tokens forcefully if auction is finished and redistribution did not happen",async () => {
                    const initBalance = BigNumber.from(await projectToken.balanceOf(addrOwner))
                    await dutch.startAuction(testAuctionTime)

                    //Owner must have lost some tokens to auction
                    expect(await projectToken.balanceOf(addrOwner)).to.be.below(initBalance)

                    //Sleep 1.5 times auction time to be sure
                    await new Promise(r => setTimeout(r, testActionTimeInMS * 1.5));

                    //Owner withdraws the remaining tokens
                    await expect(dutch.withDraw()).to.be.not.reverted

                    //Check if remaining tokens are obtained by owner

                    expect(await projectToken.balanceOf(addrOwner)).to.be.equal(initBalance)



                })

            })
        })
})
  

