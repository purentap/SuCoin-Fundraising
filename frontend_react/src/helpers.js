import { BigNumber, FixedNumber } from "ethers";
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

export const hexToHash = (fileHex) => ("0x" + CryptoJS.SHA256(fileHex)).toString()
