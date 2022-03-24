import { BigNumber, FixedNumber } from "ethers";

export const isPersistedState = stateName => {
  const sessionState = sessionStorage.getItem(stateName);
  return sessionState && JSON.parse(sessionState);
};


export const numberToFixedNumber = (amount) => {
  return FixedNumber.from(amount)
}

export const fixedNumberToNumber = (amount) => {
  const defaultDecimals = 18
  return FixedNumber.fromValue(amount,defaultDecimals)
}