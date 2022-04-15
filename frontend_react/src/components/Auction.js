import React, { useEffect, useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import AuctionInfo from './AuctionInfo';

import {fixedNumberToNumber} from "../helpers.js"
import { ethers} from 'ethers';

const Auction = () => {
    const {state} = useLocation();
    const {auctionType,auctionAddress,projectId} = state



    const [price, setPrice] = useState();
    const [tokenDist, setTokenDist] = useState();
    const [soldToken, setSoldTokens] = useState();

    
    const provider = new ethers.providers.Web3Provider(window.ethereum);


    const refreshInfo = contract => {  //Temporary - Must be different depending on the auction type
        contract.currentRate().then(rate => setPrice(fixedNumberToNumber(rate)))
        contract.soldProjectTokens().then(soldTokens => setSoldTokens(fixedNumberToNumber(soldTokens)))
        contract.numberOfTokensToBeDistributed().then(dist => setTokenDist(fixedNumberToNumber(dist)))
    }

    const navigate = useNavigate();


    const tokenBoughtFilter = {address:auctionAddress,topics: [ethers.utils.id("TokenBought(address,uint256,uint256)")]}

    
    useEffect(async() => {
        const {abi} = await import(`../contracts_hardhat/artifacts/contracts/${auctionType}.sol/${auctionType}.json`)
        const auctionContract =  new ethers.Contract(auctionAddress,abi,provider)
        refreshInfo(auctionContract) //todo it would be better if backend did this

        provider.on(tokenBoughtFilter, (log,event) => refreshInfo(auctionContract))          
    },[])   

    console.log(soldToken)
    return (
        <div>
            {
                    <div>
                        <AuctionInfo projectId={projectId} auction={auctionAddress} price={price} tokenDist={tokenDist} deposit={soldToken} />
                    </div>

             
            }

        </div>
    );
};

export default Auction;
