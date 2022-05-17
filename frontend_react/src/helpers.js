import { BigNumber, FixedNumber,ethers } from "ethers";
import { AbiCoder, defaultAbiCoder } from 'ethers/lib/utils';
import axios from "axios"

const ipfsPath = "https://sulaunch.infura-ipfs.io/ipfs/"

const CryptoJS = require('crypto-js');

export const isPersistedState = stateName => {
  const sessionState = sessionStorage.getItem(stateName);
  return sessionState && JSON.parse(sessionState);
};


export const numberToFixedNumber = (amount) => {
  return FixedNumber.from(amount)
}

export const fixedNumberToNumber = (amount) => {
  const defaultDecimals = 18
  return FixedNumber.fromValue(amount,defaultDecimals)._value
}

export const getAllPublicVariables = async (abi,auctionContract) => {
  console.log(auctionContract)
  const wantedVariables = abi.filter(element => element.inputs.length == 0 &&  element.stateMutability == "view")
  const inter = new ethers.utils.Interface(wantedVariables)
  const signatures = wantedVariables.map(variableAbi => inter.encodeFunctionData(variableAbi.name))
  const result = await auctionContract.callStatic.multicall(signatures)

  return Object.fromEntries(wantedVariables.map((curVar, i) => [curVar.name, defaultAbiCoder.decode(curVar.outputs.map(output => output.type) , result[i])]))


} 

export const getFileFromIpfs = async (ipfsHash) => {
  
  let encodedHash = ethers.utils.base58.encode("0x" + "1220" + ipfsHash)

    console.log(encodedHash)
    const apiInstance = axios.create({
      baseURL: ipfsPath,
      responseType: "blob",
    })

    let response = apiInstance
                    .get(encodedHash)
                    .catch((e) => {
                      const err = "Unable to add the project"
                      console.log(e)
                    })
  
    return response
  }


export const hexToHash = (fileHex) => ("0x" + CryptoJS.SHA256(fileHex)).toString()


export const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

