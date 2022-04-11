import { createContext, useContext } from 'react';
import Web3 from 'web3';

export const UserContext = createContext(
    {
        address: "",
        setAddress: () => {console.log("clicked")}
    }
);

export const WalletSwitcher = () => {
    const { address, setAddress } = useContext(UserContext);

    const ConnectWeb3 = async() => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = await accounts[0];
          console.log(account)
          /* var web3 = new Web3(Web3.givenProvider);
          console.log(await web3.eth.getChainId());*/
          setAddress(account)
      }

    return (
      <h4 onClick={() => ConnectWeb3()}>
        {address == "" ? "Log In" : address.substring(0,6)+ "..." + address.substring(address.length-6,address.length)}
      </h4>
    );
  };
export default UserContext;