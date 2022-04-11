const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("AuctionRunScenarios", function () {

    let owner, acc1, acc2, acc3, tokenDistribution, creationEvent, SUCoin, ProjectToken, projectManagement, fileHash;


    beforeEach(async function () {
        [owner, acc1, acc2, acc3] = await ethers.getSigners();
        //Deploy tokenDistribution & ProjectManager and create tokens
        const TokenDistribution = await hre.ethers.getContractFactory("TokenDistribution");
        const Token = await hre.ethers.getContractFactory("Token");
        const ProjectManager = await hre.ethers.getContractFactory("ProjectRegister");
        projectManagement = await ProjectManager.deploy(50);
        await projectManagement.deployed();
        tokenDistribution = await TokenDistribution.deploy(projectManagement.address);
        await tokenDistribution.deployed();
        SUCoin = await Token.deploy("SUCoin", "SU", 1000000, owner.address);
        ProjectToken = await Token.deploy("Project", "PRJ", 100000, owner.address);
        await SUCoin.deployed();
        await ProjectToken.deployed();
        //Create whitelisted users and register project
        let tx = await projectManagement.addToWhiteList(acc1.address);
        let receipt = await tx.wait(1);
        let events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(acc1.address);
        tx = await projectManagement.addToWhiteList(acc2.address);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(acc2.address);
        tx = await projectManagement.addToWhiteList(owner.address);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(owner.address);
        fileHash = ethers.utils.formatBytes32String("SAMPLEFILE");
        tx = await projectManagement.connect(owner).registerProject(fileHash);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Register");
        expect(events.args[0]).to.equal(owner.address);
        expect(events.args[1]).to.equal(fileHash);
        //Vote project proposal and approve
        tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Vote");
        expect(events.args[0]).to.equal(fileHash);
        expect(events.args[1]).to.equal(acc1.address);
        expect(events.args[2]).to.equal(true);
        expect(events.args[3]).to.equal(1);
        tx = await projectManagement.connect(owner).voteProposal(fileHash, false);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Vote");
        expect(events.args[0]).to.equal(fileHash);
        expect(events.args[1]).to.equal(owner.address);
        expect(events.args[2]).to.equal(false);
        expect(events.args[3]).to.equal(1);
        tx = await projectManagement.connect(acc2).voteProposal(fileHash, true);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("ProjectEvaluation");
        expect(events.args[1]).to.equal(true);
        expect(events.args[0]).to.equal(fileHash);
        await expect(tokenDistribution.assignToken(ProjectToken.address, ethers.utils.formatBytes32String("SAMPLEFILEE"))).to.be.revertedWith("Proposer address does not match!");
        tx = await tokenDistribution.assignToken(ProjectToken.address, fileHash);
        await tx.wait(1);
        receipt = await tx.wait();
        creationEvent = receipt.events.pop();
        expect(creationEvent.event).to.equal('TokenCreation');
        expect(creationEvent.args[2]).to.equal('PRJ');
    });

    describe("FixedCapAuction all proccess from deployment", function () {
        it("FixedCapAuction deployed& contract funded with tokens", async function () {
            //Create auction
            let tx2 = await tokenDistribution.CreateCappedAuction(1, fileHash, SUCoin.address, 10000);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const CappedFixedPriceAuction = await hre.ethers.getContractFactory("CappedFCFSAuction");
            let auction = new ethers.Contract(creationEvent2.args[1], CappedFixedPriceAuction.interface, owner);
            //let auction = await CappedFixedPriceAuction.deploy(owner.address, 1, ProjectToken.address, SUCoin.address, 10000);
            await auction.deployed();
            let tx3 = await ProjectToken.transfer(auction.address, 10000);
            await tx3.wait(1);
            let tx1 = await auction.startAuction(1);
            await tx1.wait(1);

            //Send bidders some sucoin
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            //Bidding starts
            await SUCoin.approve(auction.address, 2000)
            await SUCoin.connect(acc1).approve(auction.address, 7000);
            await SUCoin.connect(acc2).approve(auction.address, 2000);
            let bid1 = await auction.connect(acc1).bid(7000);
            let bid1_receipt = await bid1.wait(1);
            let bid1events = bid1_receipt.events.pop();
            //console.log(bid1events);
            expect(bid1events.event).to.equal("BidSubmission");
            expect(bid1events.args[0]).to.equal(acc1.address);
            expect(bid1events.args[1]).to.equal(7000);
            let bid = await auction.connect(acc2).bid(2000);
            await bid.wait(1);
            let bid2 = await auction.connect(owner).bid(2000);
            let bid2_receipt = await bid2.wait(1);
            let bid2events = bid2_receipt.events.pop();
            //console.log(bid2events);
            expect(bid2events.event).to.equal("AuctionFinished");
            expect(await ProjectToken.balanceOf(auction.address)).to.equal(0);
            expect(await ProjectToken.balanceOf(acc1.address)).to.equal(7000);
            expect(await ProjectToken.balanceOf(acc2.address)).to.equal(2000);
            expect(await ProjectToken.balanceOf(owner.address)).to.equal(91000);
            expect(await SUCoin.balanceOf(acc2.address)).to.equal(8000);
            expect(await SUCoin.balanceOf(owner.address)).to.equal(1000000 - 11000);
        });
    });

    describe("DutchAuctionProccess from deployment", function () {
        it("Auction deployed bidds are placed auction ends and tokens are claimed", async function () {
            //Create auction
            let tx2 = await tokenDistribution.CreateDutchAuction(10, 1, fileHash, 1000, SUCoin.address, 2);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const DutchAuction = await hre.ethers.getContractFactory("DutchAuction");
            let auction = new ethers.Contract(creationEvent2.args[1], DutchAuction.interface, owner);
            let tx3 = await ProjectToken.transfer(auction.address, 1000);
            await tx3.wait(1);
            let tx1 = await auction.startAuction(1);
            await tx1.wait(1);
            //Send bidders some sucoin
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            //Bidding starts
            await SUCoin.connect(acc1).approve(auction.address, 3000);
            await SUCoin.connect(acc2).approve(auction.address, 7000);
            let bid1 = await auction.connect(acc1).bid(3000);
            let bid1_receipt = await bid1.wait(1);
            let bid1events = bid1_receipt.events.pop();
            //console.log(bid1events);
            expect(bid1events.event).to.equal("BidSubmission");
            expect(bid1events.args[0]).to.equal(acc1.address);
            expect(bid1events.args[1]).to.equal(3000);
            let bid2 = await auction.connect(acc2).bid(7000);
            let bid2_receipt = await bid2.wait(1);
            let bid2events = bid2_receipt.events.pop();
            //console.log(bid2events);
            expect(bid2events.event).to.equal("AuctionFinished");
            //claim tokens
            let claim1 = await auction.connect(acc1).claimTokens();
            let claim_receipt = await claim1.wait(1);
            let claim1event = claim_receipt.events.pop();
            expect(claim1event.event).to.equal("ClaimTokens");
            expect(claim1event.args[1]).to.equal(300);
            let claim2 = await auction.connect(acc2).claimTokens();
            let claim2_receipt = await claim2.wait(1);
            let claim2event = claim2_receipt.events.pop();
            expect(claim2event.event).to.equal("ClaimTokens");
            expect(claim2event.args[1]).to.equal(700);
            //console.log(claim2event);
            expect(await ProjectToken.balanceOf(auction.address)).to.equal(0);
            expect(await ProjectToken.balanceOf(acc1.address)).to.equal(300);
            expect(await ProjectToken.balanceOf(acc2.address)).to.equal(700);
            expect(await SUCoin.balanceOf(owner.address)).to.equal(1000000 - 10000);
        });
    });

    describe("CappedFixedProportionalAuction Deployment to token distribution", function () {
        it("CFP Auction deployed& contract funded with tokens", async function () {

            //Create auction
            let tx2 = await tokenDistribution.CreateCappedProportionalAuction(1, fileHash, SUCoin.address, 10000);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const CappedFixedPriceProportionalAuction = await hre.ethers.getContractFactory("CappedAuctionWRedistribution");
            let auction = new ethers.Contract(creationEvent2.args[1], CappedFixedPriceProportionalAuction.interface, owner);
            let tx3 = await ProjectToken.transfer(auction.address, 10000);
            await tx3.wait(1);
            let tx1 = await auction.startAuction(9);
            await tx1.wait(1);

            //Send bidders some sucoin
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            //Bidding starts
            await SUCoin.approve(auction.address, 5000)
            await SUCoin.connect(acc1).approve(auction.address, 10000);
            await SUCoin.connect(acc2).approve(auction.address, 5000);
            let bid1 = await auction.connect(acc1).bid(10000);
            let bid1_receipt = await bid1.wait(1);
            let bid1events = bid1_receipt.events.pop();
            //console.log(bid1events);
            expect(bid1events.event).to.equal("BidSubmission");
            expect(bid1events.args[0]).to.equal(acc1.address);
            expect(bid1events.args[1]).to.equal(10000);
            let bid = await auction.connect(acc2).bid(5000);
            await bid.wait(1);
            let bid2 = await auction.connect(owner).bid(5000);
            let bid2_receipt = await bid2.wait(1);
            let bid2events = bid2_receipt.events.pop();
            //console.log(bid2events);
            expect(bid2events.event).to.equal("BidSubmission");
            expect(bid2events.args[0]).to.equal(owner.address);
            expect(bid2events.args[1]).to.equal(5000);
            expect(await ProjectToken.balanceOf(auction.address)).to.equal(10000);
            expect(await SUCoin.balanceOf(auction.address)).to.equal(20000);
            let txx = await SUCoin.transfer(acc1.address, 1);
            await txx.wait(1);
            let tx_x = await SUCoin.connect(acc1).transfer(owner.address, 1);
            await tx_x.wait(1);

            let claim = await auction.connect(acc1).claimTokens();
            let claimreceipt = await claim.wait(1);
            let claimevents = claimreceipt.events.pop();
            expect(claimevents.event).to.equal("ClaimTokens");
            expect(claimevents.args[0]).to.equal(acc1.address);
            expect(claimevents.args[1]).to.equal(5000);
            claim = await auction.connect(acc2).claimTokens();
            claimreceipt = await claim.wait(1);
            claimevents = claimreceipt.events.pop();
            expect(claimevents.event).to.equal("ClaimTokens");
            expect(claimevents.args[0]).to.equal(acc2.address);
            expect(claimevents.args[1]).to.equal(2500);
            claim = await auction.connect(owner).claimTokens();
            claimreceipt = await claim.wait(1);
            claimevents = claimreceipt.events.pop();
            expect(claimevents.event).to.equal("ClaimTokens");
            expect(claimevents.args[0]).to.equal(owner.address);
            expect(claimevents.args[1]).to.equal(2500);
            expect(await SUCoin.balanceOf(auction.address)).to.equal(0);
            expect(await ProjectToken.balanceOf(auction.address)).to.equal(0);
            expect(await ProjectToken.balanceOf(acc1.address)).to.equal(5000);
            expect(await ProjectToken.balanceOf(acc2.address)).to.equal(2500);
            expect(await ProjectToken.balanceOf(owner.address)).to.equal(92500);
            expect(await SUCoin.balanceOf(acc2.address)).to.equal(7500);
            expect(await SUCoin.balanceOf(owner.address)).to.equal(1000000 - 12500);
        });
    });
    
    describe("UncappedAuction test", function (){
        it("Submit bid and receive token", async function (){
            let tx2 = await tokenDistribution.CreateUncappedAuction(2, fileHash, SUCoin.address, 30);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const UncappedAuction = await hre.ethers.getContractFactory("UncappedAuction");
            let auction = new ethers.Contract(creationEvent2.args[1], UncappedAuction.interface, owner);
            const TokenMintable = await hre.ethers.getContractFactory("TokenMintable");
            let tokenMintable = await TokenMintable.deploy("Mint", "MNT", auction.address);
            await tokenMintable.deployed();
            await SUCoin.transfer(acc1.address, 20000);
            await SUCoin.transfer(acc2.address, 20000);
            let tx = await auction.startAuction(1, tokenMintable.address);
            let receipt = await tx.wait(1);
            let txevents = receipt.events.pop();
            expect(txevents.event).to.equal("AuctionStarted");
            await SUCoin.connect(acc1).approve(auction.address,7000);
            tx= await auction.connect(acc1).bid(7000);
            receipt = await tx.wait(1);
            txevents = receipt.events.pop();
            expect(txevents.event).to.equal("BidSubmission");
            expect(txevents.args[0]).to.equal(acc1.address);
            expect(txevents.args[1]).to.equal(7000);
            expect(await tokenMintable.balanceOf(acc1.address)).to.equal(3500);
            expect(await tokenMintable.balanceOf(owner.address)).to.equal(3500*3/7);
            await SUCoin.connect(acc2).approve(auction.address,14000);
            tx= await auction.connect(acc2).bid(14000);
            receipt = await tx.wait(1);
            txevents = receipt.events.pop();
            expect(txevents.event).to.equal("BidSubmission");
            expect(txevents.args[0]).to.equal(acc2.address);
            expect(txevents.args[1]).to.equal(14000);
            expect(await tokenMintable.balanceOf(acc2.address)).to.equal(7000);
            expect(await tokenMintable.balanceOf(owner.address)).to.equal(10500*3/7);
        });
    });

    describe("CappedParcelLimitFCFSAuction all proccess from deployment", function () {
        it("CappedParcelLimitFCFSAuction deployed& contract funded with tokens", async function () {
            const CappedParcelLimitFCFSAuction = await hre.ethers.getContractFactory("CappedParcelLimitFCFSAuction");
            let auction = await CappedParcelLimitFCFSAuction.deploy(owner.address, 1, ProjectToken.address, SUCoin.address, 3000, 1000);
            await auction.deployed();
            await ProjectToken.transfer(auction.address, 3000);
            await auction.startAuction(1);
            //Send bidders some sucoin
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            //Bidding starts
            await SUCoin.approve(auction.address, 1000);
            await SUCoin.connect(acc1).approve(auction.address, 2000);
            await SUCoin.connect(acc2).approve(auction.address, 1000);
            let bid1 = await auction.connect(acc2).bid(1000);
            let bid1_receipt = await bid1.wait(1);
            let bid1events = bid1_receipt.events.pop();
            expect(bid1events.event).to.equal("BidSubmission");
            expect(bid1events.args[0]).to.equal(acc2.address);
            expect(bid1events.args[1]).to.equal(1000);
            let bid = await auction.connect(owner).bid(750);
            await bid.wait(1);
            await expect(auction.connect(acc1).bid(1250)).to.be.revertedWith("Exceeds tokens per account policies.");
            bid = await auction.connect(acc1).bid(1000);
            await bid.wait(1);
            bid = await auction.connect(owner).bid(250);
            let receipt = await bid.wait(1);
            let txevents = receipt.events.pop();
            expect(txevents.event).to.equal("AuctionFinished");
            expect(await ProjectToken.balanceOf(auction.address)).to.equal(0);
            expect(await ProjectToken.balanceOf(acc1.address)).to.equal(1000);
            expect(await ProjectToken.balanceOf(acc2.address)).to.equal(1000);
            expect(await ProjectToken.balanceOf(owner.address)).to.equal(100000-2000);
            expect(await SUCoin.balanceOf(acc2.address)).to.equal(9000);
            expect(await SUCoin.balanceOf(owner.address)).to.equal(1000000 - 18000);
        });
    });
});

describe("AuctionRevertScenarios", function () {
    let owner, acc1, acc2, acc3, tokenDistribution, creationEvent, SUCoin, ProjectToken, projectManagement, fileHash;


    beforeEach(async function () {
        [owner, acc1, acc2, acc3] = await ethers.getSigners();
        //Deploy tokenDistribution & ProjectManager and create tokens
        const TokenDistribution = await hre.ethers.getContractFactory("TokenDistribution");
        const Token = await hre.ethers.getContractFactory("Token");
        const ProjectManager = await hre.ethers.getContractFactory("ProjectRegister");
        projectManagement = await ProjectManager.deploy(50);
        await projectManagement.deployed();
        tokenDistribution = await TokenDistribution.deploy(projectManagement.address);
        await tokenDistribution.deployed();
        SUCoin = await Token.deploy("SUCoin", "SU", 1000000, owner.address);
        ProjectToken = await Token.deploy("Project", "PRJ", 100000, owner.address);
        await SUCoin.deployed();
        await ProjectToken.deployed();
        //Create whitelisted users and register project
        let tx = await projectManagement.addToWhiteList(acc1.address);
        let receipt = await tx.wait(1);
        let events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(acc1.address);
        tx = await projectManagement.addToWhiteList(acc2.address);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(acc2.address);
        tx = await projectManagement.addToWhiteList(owner.address);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(owner.address);
        fileHash = ethers.utils.formatBytes32String("SAMPLEFILE");
        tx = await projectManagement.connect(owner).registerProject(fileHash);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Register");
        expect(events.args[0]).to.equal(owner.address);
        expect(events.args[1]).to.equal(fileHash);
        //Vote project proposal and approve
        tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Vote");
        expect(events.args[0]).to.equal(fileHash);
        expect(events.args[1]).to.equal(acc1.address);
        expect(events.args[2]).to.equal(true);
        expect(events.args[3]).to.equal(1);
        tx = await projectManagement.connect(owner).voteProposal(fileHash, false);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("Vote");
        expect(events.args[0]).to.equal(fileHash);
        expect(events.args[1]).to.equal(owner.address);
        expect(events.args[2]).to.equal(false);
        expect(events.args[3]).to.equal(1);
        await expect(tokenDistribution.assignToken(ProjectToken.address, ethers.utils.formatBytes32String("SAMPLEFILE"))).to.be.revertedWith("Project voting hasnt finished");
        tx = await projectManagement.connect(acc2).voteProposal(fileHash, true);
        receipt = await tx.wait(1);
        events = receipt.events.pop();
        expect(events.event).to.equal("ProjectEvaluation");
        expect(events.args[1]).to.equal(true);
        expect(events.args[0]).to.equal(fileHash);
        await expect(tokenDistribution.assignToken(ProjectToken.address, ethers.utils.formatBytes32String("SAMPLEFILEE"))).to.be.revertedWith("Proposer address does not match!");
        tx = await tokenDistribution.assignToken(ProjectToken.address, fileHash);
        await tx.wait(1);
        receipt = await tx.wait();
        creationEvent = receipt.events.pop();
        expect(creationEvent.event).to.equal('TokenCreation');
        expect(creationEvent.args[2]).to.equal('PRJ');
    });

    describe("DutchAuctionProccess should revert", function () {
        let auction;
        it("Starting with unfunded should revert and start from nonAdmin should revert", async function () {
            //Create auction
            let tx2 = await tokenDistribution.CreateDutchAuction(10, 1, fileHash, 1000, SUCoin.address, 2);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const DutchAuction = await hre.ethers.getContractFactory("DutchAuction");
            auction = new ethers.Contract(creationEvent2.args[1], DutchAuction.interface, owner);
            await expect(auction.startAuction(1)).to.be.revertedWith("Balance of the contract is less than #tokens_to_be_distributed!!!");
            let tx3 = await ProjectToken.transfer(auction.address, 1000);
            await tx3.wait(1);
            await expect(auction.connect(acc1).startAuction(1)).to.be.revertedWith("Only Admin allowed");
        });
        it("Other reverts", async function () {
            let tx3 = await ProjectToken.transfer(auction.address, 1000);
            await tx3.wait(1);
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            await SUCoin.connect(acc1).approve(auction.address, 3000);
            await SUCoin.connect(acc2).approve(auction.address, 7000);
            await expect(auction.connect(acc1).bid(100)).to.be.revertedWith("Auction not started yet!!");
            await expect(auction.connect(acc1).claimTokens()).to.be.revertedWith("Auction has not started yet!!!");
            console.log(await ProjectToken.balanceOf(auction.address));
            let tx2 = await auction.startAuction(1);
            await tx2.wait(1);
            await expect(auction.startAuction(1)).to.be.revertedWith("Auction already started");
            await expect(auction.claimTokens()).to.be.revertedWith("Auction hasn't finished!!");
            await expect(auction.connect(acc1).bid(1)).to.be.revertedWith("Bid is less than the minimum allowed price!!");
        });
    });

    describe("CappedFixedAuctionProccess should revert", function () {
        let auction;
        it("Starting with unfunded should revert and start from nonAdmin should revert", async function () {
            //Create auction
            let tx2 = await tokenDistribution.CreateCappedAuction(2, fileHash, SUCoin.address, 10000);
            await tx2.wait(1);
            let receipt2 = await tx2.wait();
            let creationEvent2 = receipt2.events.pop();
            expect(creationEvent2.event).to.equal('CreateAuctionEvent');
            //Start the auction by sending tokens to contract and sending start command
            const CappedFixedPriceAuction = await hre.ethers.getContractFactory("CappedFCFSAuction");
            auction = new ethers.Contract(creationEvent2.args[1], CappedFixedPriceAuction.interface, owner);
            await expect(auction.startAuction(1)).to.be.revertedWith("Balance of the contract is less than #tokens_to_be_distributed!!!");
            let tx3 = await ProjectToken.transfer(auction.address, 10000);
            await tx3.wait(1);
            await expect(auction.connect(acc1).startAuction(1)).to.be.revertedWith("Only Admin allowed");
        });
        it("Other reverts", async function () {
            await SUCoin.transfer(acc1.address, 10000);
            await SUCoin.transfer(acc2.address, 10000);
            await SUCoin.connect(acc1).approve(auction.address, 3000);
            await SUCoin.connect(acc2).approve(auction.address, 7000);
            await expect(auction.connect(acc1).bid(100)).to.be.revertedWith("Auction not started yet!!");
            await expect(auction.connect(acc2).withdrawRemaining()).to.be.revertedWith("Only Admin allowed");
            await expect(auction.withdrawRemaining()).to.be.revertedWith("Auction has not started yet!!!");
            let tx2 = await auction.startAuction(1);
            await tx2.wait(1);
            await expect(auction.withdrawRemaining()).to.be.revertedWith("Auction hasn't finished!!");
            await expect(auction.startAuction(1)).to.be.revertedWith("Auction already started");
            await expect(auction.withdrawRemaining()).to.be.revertedWith("Auction hasn't finished!!");
            await expect(auction.connect(acc1).bid(1)).to.be.revertedWith("Bid is less than the minimum allowed price!!");
        });
    });
});

describe("WrapperRunScenarios", function () {
    let owner, acc1, acc2, underlying, wrapper;
    beforeEach(async function () {
        [owner, acc1, acc2] = await ethers.getSigners();
        const Wrapper = await hre.ethers.getContractFactory("WrapperToken");
        const Token = await hre.ethers.getContractFactory("Token");
        underlying = await Token.deploy("underlying", "UNDR", 100000, owner.address);
        await underlying.deployed();
        wrapper = await Wrapper.deploy("SUCoin", "SU", underlying.address);
        await wrapper.deployed();
    });

    describe("Mint, Mint to another account, burn all", function () {
        it("Receive X# of token by spending X# of underlying asset", async function () {
            let tx = await underlying.approve(wrapper.address, 500);
            await tx.wait(1);
            tx = await wrapper.depositFor(owner.address, 500);
            let receipt = await tx.wait(1);
            let txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Mint");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(500);
            expect(await wrapper.balanceOf(owner.address)).to.equal(500);
        });
        it("Spending X# of underlying asset to mint X# of token to another account", async function () {
            let tx = await underlying.approve(wrapper.address, 1000);
            await tx.wait(1);
            tx = await wrapper.depositFor(owner.address, 500);
            let receipt = await tx.wait(1);
            let txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Mint");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(500);
            expect(await wrapper.balanceOf(owner.address)).to.equal(500);
            expect(await underlying.allowance(owner.address, wrapper.address)).to.equal(500);
            tx = await wrapper.depositFor(acc1.address, 500);
            receipt = await tx.wait(1);
            txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Mint");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.allowance(owner.address, wrapper.address)).to.equal(0);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(1000);
            expect(await wrapper.balanceOf(owner.address)).to.equal(500);
            expect(await wrapper.balanceOf(acc1.address)).to.equal(500);
        });

        it("Minting X tokens into 2 different account and burn progressive", async function () {
            let tx = await underlying.approve(wrapper.address, 1000);
            await tx.wait(1);
            tx = await wrapper.depositFor(owner.address, 500);
            let receipt = await tx.wait(1);
            let txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Mint");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(500);
            expect(await wrapper.balanceOf(owner.address)).to.equal(500);
            expect(await underlying.allowance(owner.address, wrapper.address)).to.equal(500);
            tx = await wrapper.depositFor(acc1.address, 500);
            receipt = await tx.wait(1);
            txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Mint");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.allowance(owner.address, wrapper.address)).to.equal(0);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(1000);
            expect(await wrapper.balanceOf(owner.address)).to.equal(500);
            expect(await wrapper.balanceOf(acc1.address)).to.equal(500);
            //Burn from owners account
            tx = await wrapper.withdrawTo(owner.address, 500);
            receipt = await tx.wait(1);
            txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Burn");
            expect(txEvent.args[0]).to.equal(owner.address);
            expect(txEvent.args[1]).to.equal(500);
            expect(await underlying.balanceOf(owner.address)).to.equal(99500);
            expect(await wrapper.balanceOf(owner.address)).to.equal(0);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(500);
            //Burn from acc1 to %30 to owner and %70 to itself
            //Burn %30 to owners account
            tx = await wrapper.connect(acc1).withdrawTo(owner.address, 150);
            receipt = await tx.wait(1);
            txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Burn");
            expect(txEvent.args[0]).to.equal(acc1.address);
            expect(txEvent.args[1]).to.equal(150);
            expect(await underlying.balanceOf(owner.address)).to.equal(99650);
            expect(await wrapper.balanceOf(owner.address)).to.equal(0);
            expect(await wrapper.balanceOf(acc1.address)).to.equal(350);
            expect(await underlying.balanceOf(acc1.address)).to.equal(0);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(350);
            //Burn %70 to calling account
            tx = await wrapper.connect(acc1).withdrawTo(acc1.address, 350);
            receipt = await tx.wait(1);
            txEvent = receipt.events.pop();
            expect(txEvent.event).to.equal("Burn");
            expect(txEvent.args[0]).to.equal(acc1.address);
            expect(txEvent.args[1]).to.equal(350);
            expect(await underlying.balanceOf(owner.address)).to.equal(99650);
            expect(await wrapper.balanceOf(owner.address)).to.equal(0);
            expect(await wrapper.balanceOf(acc1.address)).to.equal(0);
            expect(await underlying.balanceOf(acc1.address)).to.equal(350);
            expect(await underlying.balanceOf(wrapper.address)).to.equal(0);
        });
    });
});

describe("WrapperRevertScenarios", function () {
    let owner, acc1, acc2, underlying, wrapper, Wrapper;
    const ZERO_ADDRESS = ethers.constants.AddressZero;
    beforeEach(async function () {
        [owner, acc1, acc2] = await ethers.getSigners();
        Wrapper = await hre.ethers.getContractFactory("WrapperToken");
        const Token = await hre.ethers.getContractFactory("Token");
        underlying = await Token.deploy("underlying", "UNDR", 100000, owner.address);
        await underlying.deployed();
        wrapper = await Wrapper.deploy("SUCoin", "SU", underlying.address);
        await wrapper.deployed();
    });

    describe("Address(0) and zero amount reverts ", function () {
        it("depositFor reverts if address field missing", async function () {
            await expect(wrapper.connect(owner).depositFor(ZERO_ADDRESS, 20)).to.be.revertedWith("Transaction to address(0)!");
        });
        it("withdrawTo reverts if address field missing", async function () {
            await expect(wrapper.connect(owner).withdrawTo(ZERO_ADDRESS, 20)).to.be.revertedWith("Transaction to address(0)!");
        });
        it("recover reverts if address field missing", async function () {
            await expect(wrapper.connect(owner).recover(ZERO_ADDRESS)).to.be.revertedWith("Transaction to address(0)!");
        });
        it("depositFor reverts if amount == 0", async function () {
            await expect(wrapper.connect(owner).depositFor(owner.address, 0)).to.be.revertedWith("Transaction with zero value!");
        });
        it("withdrawTo reverts if amount == 0", async function () {
            await expect(wrapper.connect(owner).withdrawTo(owner.address, 0)).to.be.revertedWith("Transaction with zero value!");
        });
    });

    describe("Cannot deploy if address field of constructor is missing", function () {
        it("Cannot deploy if address field of constructor is missing", async function () {
            await expect(Wrapper.deploy("Test", "TST", ZERO_ADDRESS)).to.be.revertedWith("Underlying asset address missing.");
        });
    });
});

describe("ProjectRegister run scenarios", function () {
    let owner, acc1, acc2, tokenDistribution, projectManagement, SUCoin, acc3;

    beforeEach(async function () {
        [owner, acc1, acc2, acc3] = await ethers.getSigners();
        const TokenDistribution = await hre.ethers.getContractFactory("TokenDistribution");
        const Token = await hre.ethers.getContractFactory("Token");
        SUCoin = await Token.deploy("SUCoin", "SU", 1000000, owner.address);
        await SUCoin.deployed();
        const ProjectRegister = await hre.ethers.getContractFactory("ProjectRegister");
        projectManagement = await ProjectRegister.deploy(50);
        await projectManagement.deployed();
        tokenDistribution = await TokenDistribution.deploy(projectManagement.address);
        await tokenDistribution.deployed();
    });

    it("Should add whitelisted user", async function(){
        let tx = await projectManagement.addToWhiteList(acc1.address);
        let receipt = await tx.wait(1);
        let events = receipt.events.pop();
        expect(events.event).to.equal("WhitelistInsert");
        expect(events.args[0]).to.equal(acc1.address);
    });

    it("Should register project", async function(){
        const fileHash = ethers.utils.formatBytes32String("SAMPLEFILE");
        let tx = await projectManagement.connect(acc1).registerProject(fileHash);
        let receipt = await tx.wait(1);
        let events = receipt.events.pop();
        expect(events.event).to.equal("Register");
        expect(events.args[0]).to.equal(acc1.address);
        expect(events.args[1]).to.equal(fileHash);
    });

    describe("Project Registered ---> Voted ---> Approved", function(){
        let fileHash;
        beforeEach(async function () {
            let tx = await projectManagement.addToWhiteList(acc1.address);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("WhitelistInsert");
            expect(events.args[0]).to.equal(acc1.address);
            tx = await projectManagement.addToWhiteList(acc2.address);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("WhitelistInsert");
            expect(events.args[0]).to.equal(acc2.address);
            tx = await projectManagement.addToWhiteList(owner.address);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("WhitelistInsert");
            expect(events.args[0]).to.equal(owner.address);
            fileHash = ethers.utils.sha256("0x467782");
            console.log(fileHash)
            tx = await projectManagement.connect(acc1).registerProject(fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("Register");
            expect(events.args[0]).to.equal(acc1.address);
            expect(events.args[1]).to.equal(fileHash);
        });

        it("Project Voted& Approved", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, false);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(false);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).voteProposal(fileHash, true);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(true);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project Voted& Rejected", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, false);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(false);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, true);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).voteProposal(fileHash, false);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(false);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project DelegatedVoted& Rejected --Delegated vote with double weight", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).delegate(acc2.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(owner.address);
            expect(events.args[1]).to.equal(acc2.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).voteProposal(fileHash, false);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(false);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project DelegatedVoted& Rejected --Delegated vote with delegated user already voted", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).voteProposal(fileHash, false);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc2.address);
            expect(events.args[2]).to.equal(false);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).delegate(acc2.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(false);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project DelegatedVoted& Approve --Delegated vote with forward chain delegation", async function(){
            let tx = await projectManagement.connect(acc1).delegate(acc2.address, fileHash);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc1.address);
            expect(events.args[1]).to.equal(acc2.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).delegate(owner.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc2.address);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(2);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, true);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(true);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project DelegatedVoted& Approve --Delegated vote with mixed chain delegation", async function(){
            let tx = await projectManagement.connect(acc1).delegate(owner.address, fileHash);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc1.address);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).delegate(acc1.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc2.address);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, true);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(true);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Project DelegatedVoted& Approve --Delegated vote with backward chain delegation", async function(){
            let tx = await projectManagement.connect(owner).voteProposal(fileHash, true);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(owner.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc2).delegate(acc1.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc2.address);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(acc1).delegate(owner.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(true);
            expect(events.args[0]).to.equal(fileHash);
        });

        it("Any degree cycle in delegatiom should revert", async function(){
            let tx = await projectManagement.connect(owner).delegate(acc2.address, fileHash);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(owner.address);
            expect(events.args[1]).to.equal(acc2.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(1);
            await expect(projectManagement.connect(acc2).delegate(owner.address, fileHash)).to.be.revertedWith("Found loop in delegation.");
            tx = await projectManagement.connect(acc2).delegate(acc1.address, fileHash);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("VoteDelegate");
            expect(events.args[0]).to.equal(acc2.address);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(fileHash);
            expect(events.args[3]).to.equal(2);
            await expect(projectManagement.connect(acc1).delegate(owner.address, fileHash)).to.be.revertedWith("Found loop in delegation.");
    
        });

        it("Project Voted& Approved and revert unnecessary vote after decision", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, true);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(true);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, true);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(true);
            expect(events.args[0]).to.equal(fileHash);
            await expect(projectManagement.connect(acc2).voteProposal(fileHash, false)).to.be.revertedWith("This proposal already come to a decision.");
        });

        it("Project Voted& Rejected and revert unnecessary vote after decision", async function(){
            let tx = await projectManagement.connect(acc1).voteProposal(fileHash, false);
            let receipt = await tx.wait(1);
            let events = receipt.events.pop();
            expect(events.event).to.equal("Vote");
            expect(events.args[0]).to.equal(fileHash);
            expect(events.args[1]).to.equal(acc1.address);
            expect(events.args[2]).to.equal(false);
            expect(events.args[3]).to.equal(1);
            tx = await projectManagement.connect(owner).voteProposal(fileHash, false);
            receipt = await tx.wait(1);
            events = receipt.events.pop();
            expect(events.event).to.equal("ProjectEvaluation");
            expect(events.args[1]).to.equal(false);
            expect(events.args[0]).to.equal(fileHash);
            await expect(projectManagement.connect(acc2).voteProposal(fileHash, true)).to.be.revertedWith("This proposal already come to a decision.");
        });
        it("Vote from non-whitelist account should revert", async function(){
            await expect(projectManagement.connect(acc3).voteProposal(fileHash, true)).to.be.revertedWith("User is not in whitelist");
        });
        it("Registering same hash twice should revert", async function(){
            await expect(projectManagement.connect(acc1).registerProject(fileHash)).to.be.revertedWith("Project Already Exists!!!");
        });
    });

});