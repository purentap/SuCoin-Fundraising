import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuctionInfo from './AuctionInfo';

import axios from 'axios'
import Cookies from 'js-cookie'

import { fixedNumberToNumber, getAllPublicVariables } from "../helpers.js"
import { ethers } from 'ethers';


import { Grid } from "@material-ui/core/";
import dummyimg from '../images/dummyimg.png';
import { getFileFromIpfs } from "../helpers.js"

import { CircularProgressbar, CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css"

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';


import PriceChart from './PriceChart';


import LoadingIcon from './LoadingIcon';



const Auction = (props) => {
    const { state } = useLocation();
    const { auctionType, auction, projectId } = state
    const [imageURL, setImageURL] = useState('');

    console.log(state)



    const [startingPrice, setStartingPrice] = useState();
    const [tokenDist, setTokenDist] = useState();
    const [soldToken, setSoldTokens] = useState();
    const [startTime, setStartTime] = useState();
    const [endTime, setEndTime] = useState();
    const [totalDeposit, setTotalDeposit] = useState();
    const [currentPrice, setCurrentPrice] = useState();
    const [finalRate, setFinalRate] = useState();
    const [minimumPrice, setMinimumPrice] = useState();
    const [initDist,setInitDist] = useState();

    const [isLoading, setIsLoading] = useState(true);


    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const auctionTypesForChart = ["DutchAuction", "OBFCFSAuction", "PseudoCappedAuction", "StrictDutchAuction", "UncappedAuction"];


    const refreshInfo = async (abi, auctionContract) => {
        const { rate, soldProjectTokens, numberOfTokensToBeDistributed, minPrice, startTime, latestEndTime, totalDepositedSucoins, getCurrentRate, finalRate,getTotalSupply,initTokens} = await getAllPublicVariables(abi, auctionContract)
        const currentSupply = (getTotalSupply ?? numberOfTokensToBeDistributed)[0]

        switch (auctionType) {
            case "StrictDutchAuction":
                setInitDist(fixedNumberToNumber(initTokens[0]))
            case "DutchAuction":
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setStartingPrice(fixedNumberToNumber(rate[0]))
                setTokenDist(fixedNumberToNumber(currentSupply))
                setFinalRate(fixedNumberToNumber(finalRate[0]))
                setCurrentPrice(fixedNumberToNumber(getCurrentRate[0]))
                break;
            case "UncappedAuction":
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setStartingPrice(fixedNumberToNumber(rate[0]))
                break;
            case "PseudoCappedAuction":
                setTokenDist(fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                setCurrentPrice(fixedNumberToNumber(getCurrentRate[0]))
                break
            case "OBDutchAuction":
                setTokenDist(fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                setSoldTokens(fixedNumberToNumber(soldProjectTokens[0]))
                setMinimumPrice(fixedNumberToNumber(minPrice[0]))
                break;
        }
        setStartTime(startTime.toString())
        setEndTime(latestEndTime.toString())
        setTotalDeposit(fixedNumberToNumber(totalDepositedSucoins[0]))
    }




    const navigate = useNavigate();


    const tokenBoughtFilter = { address: auction, topics: [ethers.utils.id("TokenBought(address,uint256,uint256)")] }


    useEffect(async () => {
        const { abi } = await import(`../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/${auctionType}.sol/${auctionType}.json`)
        const auctionContract = new ethers.Contract(auction, abi, provider)


        const imageResult = await getFileFromIpfs(state.fileHash, "image")
        setImageURL(URL.createObjectURL(imageResult.data))

        console.log("before refresh info")

        refreshInfo(abi, auctionContract) //todo it would be better if backend did this

        provider.on(tokenBoughtFilter, (log, event) => refreshInfo(abi, auctionContract))

        setIsLoading(false);
    }, [])

    const getFile = async () => {

        getFileFromIpfs(state.fileHash, "whitepaper").then(res => downloadFile(res.data))


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
        isLoading ?

        <div style={{ width: '85%', margin: "auto" }}>
            <div className="sectionName" style={{ paddingLeft: "200px", paddingTop: "25px", paddingBottom: "25px" }}>Auction Details</div>
            <LoadingIcon />
        </div>

        : <div style={{ width: '85%', margin: "auto" }}>
            <div className="sectionName" style={{ paddingLeft: "200px", paddingTop: "25px", paddingBottom: "25px" }}>Auction Details</div>

            <Grid container spacing={0}>
                <Grid item xs style={{ display: "flex", flexDirection: "column", justifyContent: 'space-between'}}>
                    <div className="project-image" style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                        <img src={imageURL ?? dummyimg} alt="" style={{ borderRadius: '20px', width: '500px', height:'450px' }} />
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

                <Grid item xs style={{ display: "flex", flexDirection: "column", justifyContent: 'space-between' }}>
                    <Grid item xs>
                        <div className='auction-info'>
                            <AuctionInfo
                                projectId={projectId}
                                auction={auction}
                                tokenName={state.tokenName}
                                price={currentPrice}
                                tokenDist={tokenDist}
                                deposit={soldToken}
                                totalRaise={totalDeposit}
                                startingDate={startTime}
                                endingDate={endTime}
                                auctionType={auctionType}
                            />
                        </div>
                    </Grid>
                </Grid>
            </Grid>

            <br></br>
            <div style={{width:"70%", margin:"auto"}}>
                <Grid item xs style={{ display: "flex", flexDirection: "row", justifyContent: 'space-between' }}>
                    <Grid item xs style={{ display: "flex", flexDirection: "column", justifyContent: 'space-between' }}>
                        <div className="sectionName" style={{ textAlign: 'center' }}>{"Auction Progress"}</div>
                        <br></br>
                        <Grid item xs>
                            <div style={{ width: "50%", margin: "auto" }}>
                                <CircularProgressbar
                                    value={(Date.now() / 1000 - startTime) / (endTime - startTime) * 100}
                                    text={Math.round(Math.min(100, (Date.now() / 1000 - startTime) / (endTime - startTime) * 100)) + '% time elapsed'}
                                    background={true}
                                    backgroundPadding={6}
                                    styles={buildStyles({
                                        backgroundColor: "#173A6A",
                                        textColor: "#fff",
                                        pathColor: "#fff",
                                        trailColor: "transparent",
                                        textSize: 8
                                    })}
                                />
                            </div>
                        </Grid>
                    </Grid>
                    <Grid item xs style={{ display: "flex", flexDirection: "column", justifyContent: 'space-between' }}>
                        <div className="sectionName" style={{ textAlign: 'center' }}>{"Sold Token Progress"}</div>
                        <br></br>
                        <Grid item xs>
                            <div style={{ width: "50%", margin: "auto" }}>
                                <CircularProgressbar
                                    value={soldToken / tokenDist * 100}
                                    text={parseFloat(soldToken / tokenDist * 100).toFixed(4) + '%'}
                                    circleRatio={0.75}
                                    styles={buildStyles({
                                        rotation: 1 / 2 + 1 / 8,
                                        strokeLinecap: "butt",
                                        trailColor: "#fff",
                                        textSize: 12,
                                        textColor: "#173A6A",
                                        pathColor: "#173A6A",
                                    })}
                                />
                            </div>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
            <br></br>
            <br></br>
            {auctionTypesForChart.includes(auctionType) ?
                <PriceChart
                    auctionType={auctionType}
                    startTime={startTime}
                    latestEndTime={endTime}
                    initialRate={startingPrice}
                    finalRate={finalRate}
                    initialSupply={initDist}
                    soldTokens={soldToken}
                /> : null}
        </div>
    );
};

export default Auction;