import React, { useEffect, useState } from 'react';
import { useNavigate,useLocation } from 'react-router-dom';
import AuctionInfo from './AuctionInfo';

import {fixedNumberToNumber,getAllPublicVariables} from "../helpers.js"
import { ethers} from 'ethers';
import Button from 'react-bootstrap/Button'


const Auction = () => {
    const {state} = useLocation();
    const {auctionType,auction,projectId} = state

    console.log(state)



    const [price, setPrice] = useState();
    const [tokenDist, setTokenDist] = useState();
    const [soldToken, setSoldTokens] = useState();

    
    const provider = new ethers.providers.Web3Provider(window.ethereum);


   

    const refreshInfo = async (abi,auctionContract) =>  {
        const {rate,currentRate,soldProjectTokens,numberOfTokensToBeDistributed,minPrice} = await getAllPublicVariables(abi,auctionContract)

        switch(auctionType) {
            case "DutchAuction":
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setPrice(fixedNumberToNumber(currentRate[0]))
                setTokenDist(fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                break;
            case "UncappedAuction":
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setPrice(fixedNumberToNumber(rate[0]))
                break;
            case "PseudoCappedAuction":
                setTokenDist(fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                setPrice(fixedNumberToNumber(currentRate[0]))
                break
            case "OBDutchAuction":
                setTokenDist(fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setPrice(fixedNumberToNumber(minPrice[0]))
                break;

            
            
        }


    }


 

    const navigate = useNavigate();


    const tokenBoughtFilter = {address:auction,topics: [ethers.utils.id("TokenBought(address,uint256,uint256)")]}

    
    useEffect(async() => {
        const {abi} = await import(`../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/${auctionType}.sol/${auctionType}.json`)
        const auctionContract =  new ethers.Contract(auction,abi,provider)

      

        refreshInfo(abi,auctionContract) //todo it would be better if backend did this

        provider.on(tokenBoughtFilter, (log,event) => refreshInfo(abi,auctionContract))          
    },[])   

    return (
        <div>
            {
                    <div>
                        <AuctionInfo projectId={projectId} auction={auction} price={price} tokenDist={tokenDist} deposit={soldToken} />
                    </div>

             
            }

        </div>
    );
};

export default Auction;
