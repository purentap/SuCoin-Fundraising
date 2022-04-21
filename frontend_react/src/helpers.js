import { BigNumber, FixedNumber,ethers } from "ethers";
import { AbiCoder, defaultAbiCoder } from 'ethers/lib/utils';

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
  const wantedVariables = abi.filter(element => element.inputs.length == 0 &&  element.stateMutability == "view")
  const inter = new ethers.utils.Interface(wantedVariables)
  const signatures = wantedVariables.map(variableAbi => inter.encodeFunctionData(variableAbi.name))
  const result = await auctionContract.callStatic.multicall(signatures)

  return Object.fromEntries(wantedVariables.map((curVar, i) => [curVar.name, defaultAbiCoder.decode(curVar.outputs.map(output => output.type) , result[i])]))


} 

export const hexToHash = (fileHex) => ("0x" + CryptoJS.SHA256(fileHex)).toString()
