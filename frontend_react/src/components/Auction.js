import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuctionInfo from './AuctionInfo';

import axios from 'axios'
import Cookies from 'js-cookie'

import { fixedNumberToNumber, getAllPublicVariables } from "../helpers.js"
import { ethers } from 'ethers';


import { Grid } from "@material-ui/core/";
import dummyimg from '../images/dummyimg.png';
import {getFileFromIpfs} from "../helpers.js"


const Auction = (props) => {
    const { state } = useLocation();
    const { auctionType, auction, projectId } = state
    const [imageURL,setImageURL] = useState('');

    console.log(state)



    const [price, setPrice] = useState();
    const [tokenDist, setTokenDist] = useState();
    const [soldToken, setSoldTokens] = useState();
    const [startTime,setStartTime] = useState();
    const [endTime,setEndTime] = useState();


    const provider = new ethers.providers.Web3Provider(window.ethereum);




    const refreshInfo = async (abi, auctionContract) => {
        const { rate, currentRate, soldProjectTokens, numberOfTokensToBeDistributed, minPrice,startTime,latestEndTime } = await getAllPublicVariables(abi, auctionContract)
        console.log(await getAllPublicVariables(abi,auctionContract))

        switch (auctionType) {
            case "StrictDutchAuction":
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
        setStartTime(startTime.toString())
        setEndTime(latestEndTime.toString())


    }




    const navigate = useNavigate();


    const tokenBoughtFilter = { address: auction, topics: [ethers.utils.id("TokenBought(address,uint256,uint256)")] }


    useEffect(async () => {
        const { abi } = await import(`../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/${auctionType}.sol/${auctionType}.json`)
        const auctionContract = new ethers.Contract(auction, abi, provider)
        
 
        const imageResult = await getFileFromIpfs(state.fileHash,"image")
        setImageURL(URL.createObjectURL(imageResult.data))

        refreshInfo(abi, auctionContract) //todo it would be better if backend did this

        provider.on(tokenBoughtFilter, (log, event) => refreshInfo(abi, auctionContract))
    }, [])

    const getFile = async () => {
      
      getFileFromIpfs(state.fileHash,"whitepaper").then(res => downloadFile(res.data))
    
    
      const downloadFile = async (file) => {
        const reader = new FileReader()
    
      
    
        reader.readAsText(file);
        reader.onloadend = async () => {
          const data = window.URL.createObjectURL(file);
          const tempLink = await document.createElement('a');
          tempLink.href = data;
          tempLink.download = "Project_#" + state.projectID + ".pdf"; // some props receive from the component.
          tempLink.click();
        }
      }
    }

    return (
        <div>
            <div className="sectionName" style={{ paddingLeft: "200px", paddingTop: "25px", paddingBottom: "25px" }}>Auction Details</div>

            <Grid container spacing={0}>
                <Grid item xs style={{ display: "flex", flexDirection: "column", justifyContent: 'space-between' }}>
                    <div className="project-image" style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                        <img src={imageURL ?? dummyimg} alt="" style={{ borderRadius: '20px' }} />
                    </div>
                    <br></br>
                    <div className="sectionName" style={{ textAlign: 'center' }}>{state.projectName}</div>
                    <br></br>
                    <div className="simpletext" style={{ textAlign: 'center', fontSize: '800', fontWeight: '500' }}>{state.projectDescription}</div>
                    <br></br>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                        <button className="button" onClick={getFile}>
                            <a>
                                Download Project PDF
                            </a>
                        </button>
                    </div>
                </Grid>
            


                <Grid item xs>
                    <div className='auction-info'>
                        <AuctionInfo
                            projectId={projectId}
                            auction={auction}
                            tokenName={state.tokenName}
                            price={price}
                            tokenDist={tokenDist}
                            deposit={soldToken}
                            totalRaise={125}
                            startingDate={startTime}
                            endingDate={endTime}
                            auctionType={auctionType}
                        />
                    </div>
                </Grid>
            </Grid>
        </div>
    );
};

export default Auction;