require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
const privateKey = "d14b01a39bfa635db2da87018028676406d2d1684cb500cacfb89b096da1ed8e"
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [privateKey]
    },
    eth: {
      url: "http://127.0.0.1:7545",
      accounts: ["cc59d5791667a9c38445f6584f3647bfa54ef1919030068ae446875ac8933c80"]
    },
    avalanhe: {
      url: "https://speedy-nodes-nyc.moralis.io/7918f6b4c7b9adebcdeb036e/avalanche/testnet",
      accounts: [privateKey]
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
}