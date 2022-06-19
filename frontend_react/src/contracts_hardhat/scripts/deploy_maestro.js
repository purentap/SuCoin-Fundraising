//Needs around 2 avax for deployment or else it can fail horribly

const currentRegisterContract = "0x5aAd7987008f0B6E52cA40ca01651055A90673e2"
const currentSucoin = "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce"
let libAddress = "0xfc7cde313ed56eff607a3d79c6f565111ee074a6"



async function deployMaestro(sucoinAddress,projectManagerAddress,    wantedAuctionTypes = ["DutchAuction","FCFSAuction","OBDutchAuction","OBFCFSAuction","PseudoCappedAuction","StrictDutchAuction","UncappedAuction"]) {

   


    
    if (!libAddress) {
        const Lib = await ethers.getContractFactory("BokkyPooBahsRedBlackTreeLibrary")
        const lib = await Lib.deploy({gasPrice: ethers.utils.parseUnits('50.0', 'gwei')})
        await lib.deployed()
        libAddress = lib.address
        console.log(libAddress)
    }



    const [deployer] = await ethers.getSigners();

    const baseNonce = await deployer.getTransactionCount()

    

    
    

    const result = await Promise.all(wantedAuctionTypes.map(async (type) => {
                        const Auction = await ethers.getContractFactory(type,
                        type == "OBDutchAuction" ? {libraries:{"BokkyPooBahsRedBlackTreeLibrary" : libAddress}} : {})
                        const auction = await Auction.deploy({gasPrice: ethers.utils.parseUnits('50.0', 'gwei'),nonce: baseNonce + wantedAuctionTypes.indexOf(type)})
                        await auction.deployed()
                        return [type,auction.address]
                    }))
    
    //Parse 2d array into 2 1d arrays
    const [auctionTypes,auctionAddresses] = [result.map(x => x[0]), result.map(x => x[1])]


    const Maestro = await ethers.getContractFactory("Maestro")
    const maestro = await Maestro.deploy(sucoinAddress,projectManagerAddress,auctionTypes,auctionAddresses)
    await maestro.deployed()
    return maestro.address

  }
  
  deployMaestro(currentSucoin,currentRegisterContract)
    .then((address) => {console.log(`Maestro address is : ${address}`);process.exit(0)})
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });