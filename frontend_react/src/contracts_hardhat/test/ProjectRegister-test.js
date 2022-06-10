const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("Project Register cases", () => {                                      

    //Signers of test accounts
    let owner,admin,base1,base2,whitelist1,whitelist2,whitelist3,blacklist


    let addrOwner,addrAdmin,addr1,addr2,addrWhitelist1,addrWhitelist2,addrWhitelist3,addrBlacklist

    

    const admin_role = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"))

    const temp_project_hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("temp_project_hash"))




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
        [owner,admin,base1,base2,whitelist1,whitelist2,whitelist3,blacklist] = await ethers.getSigners();
        [addrOwner,addrAdmin,addr1,addr2,addrWhitelist1,addrWhitelist2,addrWhitelist3,addrBlacklist] = await Promise.all((await ethers.getSigners()).map(async (signer) => signer.getAddress()));
        
        projectRegister = await ethers.getContractFactory("ProjectRegister")
        projectRegisterInstance = await projectRegister.deploy(90)
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
                const whiteListed1 =  projectRegisterInstance.connect(whitelist1)
                await expect(whiteListed1.editUserStatus(addr1,USER_STATUS.WHITELISTED)).to.be.reverted
               
            })                
       

            it("Owner and admin should be able to add user to whitelist (hasRole test)" ,async () => {
                //admin
                const adminUser =  projectRegisterInstance.connect(admin)
                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.WHITELISTED)).to.be.not.reverted
                //Check if addrwhitelist1 is in whitelist
                expect(await projectRegisterInstance.statusList(addrWhitelist1)).to.be.equal(USER_STATUS.WHITELISTED)
    
                //owner
                const ownerUser =  projectRegisterInstance.connect(owner)
                await expect(ownerUser.editUserStatus(addrWhitelist2,USER_STATUS.WHITELISTED)).to.be.not.reverted
                //Check if addrwhitelist2 is in whitelist
                expect(await projectRegisterInstance.statusList(addrWhitelist2)).to.be.equal(USER_STATUS.WHITELISTED)
            })

            it("Whitelist count should change when someone is added to /removed  from whiteList",async() => {
                const whitelistCount = parseInt(await projectRegisterInstance.whitelistedCount())
                //admin
                const adminUser =  projectRegisterInstance.connect(admin)

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
                const adminUser =  projectRegisterInstance.connect(admin)

                await expect(adminUser.editUserStatus(addrWhitelist1,USER_STATUS.WHITELISTED)).to.be.revertedWith("User already has this status")

            })


    
        })

        describe("Blacklist tests", () => {
            it("Admin and Owner should be able to add user to blacklist",async () => {
            
                const adminUser =  projectRegisterInstance.connect(admin)
                await expect(adminUser.editUserStatus(addrBlacklist,USER_STATUS.BLACKLISTED)).to.be.not.reverted
                //Check if addrblacklist is in blacklist
                expect(await projectRegisterInstance.statusList(addrBlacklist)).to.be.equal(USER_STATUS.BLACKLISTED)
                //Owner has admin perms so no need
            })

            it("Blacklisted users can't register a project", async() => {
                const blackListed =  projectRegisterInstance.connect(blacklist)
                await expect(blackListed.registerProject(temp_project_hash)).to.be.revertedWith("User is in blacklist")
    
            })

            it("Others can", async() => {
                const base =  projectRegisterInstance.connect(base1)
                await expect(base.registerProject(temp_project_hash)).to.be.not.reverted
    
            })

        })

        describe("Multisig permissions",() => {
            //For removeProject multiSig(ADMIN_ROLE,2,100)

            it("Non admin users should not be able to call remove project",async () => {
                const base =  projectRegisterInstance.connect(base1)

                await expect(base.removeProject(temp_project_hash)).to.be.revertedWith("You don't have permission to run this function")
            })


            describe("Admin case",() => {


                it("Admin should be able to call remove project",async () => {
                    const adminUser =  projectRegisterInstance.connect(admin)
                    await expect(adminUser.removeProject(temp_project_hash)).to.be.not.reverted
                })


              it("Until count param amount of admins sign the function project must not be removed", async () => {
                expect((await projectRegisterInstance.projectsRegistered(temp_project_hash)).proposer).to.be.equal(addr1)

              })

              it("Same admin must not be able to call remove project twice before multiSig ends or ends",async () => {
                const adminUser =  projectRegisterInstance.connect(admin)
                await expect(adminUser.removeProject(temp_project_hash)).to.be.revertedWith("You can't sign twice, you need to wait other signers")
              })



              describe("Time ends before sign collection", () => {

                before(async () => {
                    await hre.network.provider.send("hardhat_mine", ["0x64"]);
                })

                
                it("Signs are reset after timeout and it can be signed again", async () => {
                    const adminUser =  projectRegisterInstance.connect(admin)
                    await expect(adminUser.removeProject(temp_project_hash)).to.be.not.reverted
                })

                it("Sign counts are reseted so signing again does not result in multiple signs",async () => {
                    expect((await projectRegisterInstance.projectsRegistered(temp_project_hash)).proposer).to.be.equal(addr1)
                })

               
                
              })

          


              describe("Signed in time", async() => {

                it("Multiple admins can sign remove project",async () => {
                    await expect(projectRegisterInstance.removeProject(temp_project_hash)).to.be.not.reverted
                })

                it("When enough admin sign the function project must be removed", async () => {

                    expect((await projectRegisterInstance.projectsRegistered(temp_project_hash)).proposer).to.be.not.equal(addr1)
    
                  })

                it("When multisig resets by finishing it can be called by same admins again",async () => {
                    await expect(projectRegisterInstance.removeProject(temp_project_hash)).to.be.not.reverted

                })
              })
              
            })

          

            
        })

      
  
    })

    describe("Project / Voting tests",() => {
        beforeEach(async () => {
            console.log("a")
            await projectRegisterInstance.registerProject(temp_project_hash)
        })

        afterEach(async () => {
            const adminUser =  projectRegisterInstance.connect(admin)
            await adminUser.removeProject(temp_project_hash)
            await projectRegisterInstance.removeProject(temp_project_hash)
        })

        it("Registered project can't be registered again",async () => {
            await expect(projectRegisterInstance.registerProject(temp_project_hash)).to.be.revertedWith("Project Already Exists!!!")
        })

        describe("Voting tests",() => {

            it("Non whitelisted users can't vote",async () => {
                const base =  projectRegisterInstance.connect(base1)
                await expect(base.voteProposal(temp_project_hash,1)).to.be.revertedWith("User is not in whitelist")
            })

            it("Users Can't vote to non existing projects",async () => {
                const whitelisted =  projectRegisterInstance.connect(whitelist1)
                await expect(whitelisted.voteProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("random_something")),1)).to.be.revertedWith("Project does not exist")
            })

            it("Normal weighted votes increase voting count by 1",async() => {
                const whitelisted =  projectRegisterInstance.connect(whitelist1)
                await expect(whitelisted.voteProposal(temp_project_hash,1)).to.be.not.reverted
                expect((await projectRegisterInstance.projectsRegistered(temp_project_hash)).approved).to.be.equal(1)
            })

            describe("Delegating Votes",() => {
          

              
             
                it("Users Can't vote to non existing projects",async () => {
                    const whitelisted =  projectRegisterInstance.connect(whitelist1)
                    await expect(whitelisted.voteProposal(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("random_something")),1)).to.be.revertedWith("Project does not exist")
                })

                it("Users can't delegate to themselves",async () => {
                    const whitelisted =  projectRegisterInstance.connect(whitelist1)
                    return expect(whitelisted.delegate(addrWhitelist1,temp_project_hash)).to.be.revertedWith("Self-delegation is disallowed.")
                })

                it("Already voted users can't delegate",async () => {
                    const whitelisted =  projectRegisterInstance.connect(whitelist1)
                    await expect(whitelisted.voteProposal(addrWhitelist2,1)).to.be.not.reverted
                    await expect(whitelisted.delegate(addrWhitelist2,temp_project_hash)).to.be.revertedWith("User already voted")
                })

                it("Delegating can't be looped",async () => {
                    const whitelisted1 =  projectRegisterInstance.connect(whitelist1)
                    const whitelisted2 =  projectRegisterInstance.connect(whitelist2)
                    const whitelisted3 =  projectRegisterInstance.connect(whitelist3)

                    await expect(whitelisted1.delegate(addrWhitelist2,temp_project_hash)).to.be.not.reverted
                    await expect(whitelisted2.delegate(addrWhitelist3,temp_project_hash)).to.be.not.reverted
                    await expect(whitelisted3.delegate(addrWhitelist1,temp_project_hash)).to.be.revertedWith("Found loop in delegation.")



                })
            })

        })

     


            









    })

})

 

  