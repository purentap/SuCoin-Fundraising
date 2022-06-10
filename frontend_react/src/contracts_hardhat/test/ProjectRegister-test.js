const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("Project Register cases", () => {                                      

    //Signers of test accounts
    let owner,admin,base1,base2,whitelist1,whitelist2,whitelist3


    let addrOwner,addrAdmin,addr1,addr2,addrWhitelist1,addrWhitelist2,addrWhitelist3

    

    const admin_role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"))



    let projectRegister
    let projectRegisterInstance

    const USER_STATUS = {
        "DEFAULT": 0,
        "WHITELISTED": 1,
        "BLACKLISTED": 2,
        "VIWER":4,
    }


    //ProjectRegister contract

   
    
    before(async () => {
        [owner,admin,base1,base2,whitelist1,whitelist2,whitelist3] = await ethers.getSigners();
        [addrOwner,addrAdmin,addr1,addr2,addrWhitelist1,addrWhitelist2,addrWhitelist3] = await Promise.all((await ethers.getSigners()).map(async (signer) => signer.getAddress()));
        
        projectRegister = await ethers.getContractFactory("ProjectRegister")
        projectRegisterInstance = await projectRegister.deploy(10)
        projectRegisterInstance.deployed()

    })


    describe("Permission tests", () => {

        it("owner should have admin role",async() => {
            expect(await projectRegisterInstance.hasRole(admin_role,addrOwner)).to.be.true
        })

        it("Initially non owner users have default permission and node admin role",async () => {
            const currentPermission = await projectRegisterInstance.statusList(addr1)
           
            expect(currentPermission).to.be.equal(USER_STATUS.DEFAULT)

            expect(await projectRegisterInstance.hasRole(admin_role,addr1)).to.be.false
        })

        it("Owner should be able to add make others admin",async () => {
            await expect(projectRegisterInstance.grantRole(admin_role,addrAdmin)).to.be.not.reverted
            expect (await projectRegisterInstance.hasRole(admin_role,addrAdmin)).to.be.true
        })


        describe("Whitelist tests", () => {

            it("Normal and whitelisted users should not be able to add to whitelist",async () => {

                //Whitelisted user
                const whiteListed1 = await projectRegisterInstance.connect(whitelist1)
                await expect(whiteListed1.editUserStatus(addr1,USER_STATUS.WHITELISTED)).to.be.reverted
               
            })                
       

            it("Owner and admin should be able to add user to whitelist" ,async () => {
                //admin
                const adminUser = await projectRegisterInstance.connect(admin)
                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.WHITELISTED)).to.be.not.reverted
                //Check if addrwhitelist1 is in whitelist
                expect(await projectRegisterInstance.statusList(addrWhitelist1)).to.be.equal(USER_STATUS.WHITELISTED)
    
                //owner
                const ownerUser = await projectRegisterInstance.connect(owner)
                await expect(ownerUser.editUserStatus(addrWhitelist2,USER_STATUS.WHITELISTED)).to.be.not.reverted
                //Check if addrwhitelist2 is in whitelist
                expect(await projectRegisterInstance.statusList(addrWhitelist2)).to.be.equal(USER_STATUS.WHITELISTED)
            })

            it("Whitelist count should change when someone is added to /removed  from whiteList",async() => {
                const whitelistCount = parseInt(await projectRegisterInstance.whitelistedCount())
                //admin
                const adminUser = await projectRegisterInstance.connect(admin)

                //Remove whitelist from user whitelist1
                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.DEFAULT)).to.be.not.reverted
                //Check if whitelist count decreased
                expect(await projectRegisterInstance.whitelistedCount()).to.be.equal(whitelistCount - 1)


                //Give back whitelist to user whitelist1

                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.WHITELISTED)).to.be.not.reverted

                //Check if whitelist count increased

                expect(await projectRegisterInstance.whitelistedCount()).to.be.equal(whitelistCount)


                //Add new whitelisted user 3

                await expect(adminUser.editUserStatus(addrWhitelist3,USER_STATUS.WHITELISTED)).to.be.not.reverted

                //Check if whitelist count increased

                expect(await projectRegisterInstance.whitelistedCount()).to.be.equal(whitelistCount + 1)




            })

            it("Already whitelisted users should not be able to added to whitelist again",async () => {
                const adminUser = await projectRegisterInstance.connect(admin)

                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.WHITELISTED)).to.be.revertedWith("User already has this status")

            })


    
        })

     

        
     

   
    })

})

 

  