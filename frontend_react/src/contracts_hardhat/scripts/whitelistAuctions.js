const fs = require('fs');
const { ethers } = require('hardhat');
const path = require('path')

const pathToAuctions = "./artifacts/contracts/DeployableAuctions"


const jsonsInDir = fs.readdirSync(pathToAuctions).map(fileName => `${fileName}/${path.parse(fileName).name}.json`);
let whiteListData = []

jsonsInDir.forEach(file => {
    const fileData = fs.readFileSync(path.join(pathToAuctions, file));
    const json = JSON.parse(fileData.toString());
    console.log(json.deployedBytecode)
    whiteListData.push({"hash":ethers.utils.keccak256(json.deployedBytecode),"name":json.contractName})

  });
console.log(whiteListData)

