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
import { min } from 'date-fns';



const Auction = (props) => {
    const { state } = useLocation();
    const { auctionType, auction, projectId } = state
    const [imageURL, setImageURL] = useState('');

    console.log(state)

 

    const [currentData,setCurrentData] = useState()


    const [isLoading, setIsLoading] = useState(true);
    const [historicData,setHistoricData] = useState();


    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const auctionTypesForChart = ["DutchAuction", "OBFCFSAuction", "PseudoCappedAuction", "StrictDutchAuction", "UncappedAuction","FCFSAuction","OBDutchAuction"];


    const { startTime, endTime,startingPrice,currentPrice , initDist,finalRate,minimumPrice,tokenDist,totalDeposit,soldTokens} = currentData ??  {}

    const refreshInfo = async (abi, auctionContract) => {

        const { rate, soldProjectTokens, numberOfTokensToBeDistributed, minPrice, startTime, latestEndTime, totalDepositedSucoins, getCurrentRate, finalRate,getTotalSupply,initTokens} = await getAllPublicVariables(abi, auctionContract)
        const currentSupply = (getTotalSupply ?? numberOfTokensToBeDistributed)[0]

        const auctionInfo = {}

        switch (auctionType) {
            case "StrictDutchAuction":
                auctionInfo.initDist = fixedNumberToNumber(initTokens[0])
            case "DutchAuction":
                auctionInfo.soldTokens = fixedNumberToNumber(soldProjectTokens[0])
                auctionInfo.startingPrice = fixedNumberToNumber(rate[0])
                auctionInfo.tokenDist = fixedNumberToNumber(currentSupply)
                auctionInfo.finalRate = fixedNumberToNumber(finalRate[0])
                auctionInfo.currentPrice = fixedNumberToNumber(getCurrentRate[0])
                break;
            case "FCFSAuction":
                auctionInfo.tokenDist = (fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
            case "UncappedAuction":
                auctionInfo.soldTokens = fixedNumberToNumber(soldProjectTokens[0])
                auctionInfo.startingPrice = fixedNumberToNumber(rate[0])
                break;
            case "PseudoCappedAuction":
                auctionInfo.tokenDist = (fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                auctionInfo.currentPrice = fixedNumberToNumber(getCurrentRate[0])
                break
            case "OBDutchAuction":
                auctionInfo.tokenDist = (fixedNumberToNumber(numberOfTokensToBeDistributed[0]))
                auctionInfo.soldTokens = (fixedNumberToNumber(soldProjectTokens[0]))
                auctionInfo.minimumPrice = (fixedNumberToNumber(minPrice[0]))
                auctionInfo.currentPrice = fixedNumberToNumber(getCurrentRate[0])

                break;
        }

        auctionInfo.startTime = startTime[0]
        auctionInfo.endTime = latestEndTime[0]
        auctionInfo.totalDeposit = fixedNumberToNumber(totalDepositedSucoins[0])


        setHistoricData(await getHistoricalData(auctionContract,auctionInfo))

        setCurrentData(auctionInfo)
    }






    const getHistoricalData = async (auctionContract,auctionInfo) => {

        

        const { startTime, endTime,startingPrice,currentPrice , initDist,finalRate,minimumPrice,tokenDist,totalDeposit} = auctionInfo
        
        const bidFilter = auctionContract.filters.VariableChange()
        const bidEvents = await auctionContract.queryFilter(bidFilter)


        const timeStamps = Object.fromEntries(await Promise.all(bidEvents.map(async (bidEvent) => [bidEvent.blockNumber,(await provider.getBlock(bidEvent.blockNumber)).timestamp * 1000])))

        const groupedMap =  bidEvents.reduce(
            (entryMap, e) => entryMap.set(e.args[0], [...entryMap.get(e.args[0])||[], e]),
            new Map()
        );
        
      


        Array.from(groupedMap.keys()).map( key =>
            groupedMap.set(key, groupedMap.get(key).reduce(
                (entryMap, e) => entryMap.set(timeStamps[e.blockNumber], parseFloat(fixedNumberToNumber(e.args[1]))),
                new Map()
        )))


        

        groupedMap.set("currentRate", [[startTime * 1000 ,parseFloat(startingPrice ?? 0)] , ...(groupedMap.get("currentRate") ?? []) , [Math.min(new Date(),endTime * 1000),parseFloat(currentPrice)]])
        groupedMap.set("numberOfTokensToBeDistributed", [[startTime * 1000,parseFloat(initDist)] ,...(groupedMap.get("numberOfTokensToBeDistributed") ?? []) , [Math.min(new Date(),endTime * 1000),parseFloat(tokenDist)]])
        groupedMap.set("totalDepositedSucoins", [[startTime * 1000,parseFloat(0)] ,...(groupedMap.get("totalDepositedSucoins") ?? []) , [Math.min(new Date(),endTime * 1000),parseFloat(totalDeposit)]])
        groupedMap.set("minPrice", [[startTime * 1000,parseFloat(fixedNumberToNumber(1))] ,...(groupedMap.get("minPrice") ?? []) , [Math.min(new Date(),endTime * 1000),parseFloat(minimumPrice)]])


        console.log(groupedMap)
        return groupedMap;



        
    }

        
  


    

    



  
  





   console.log(currentData)
    
    


 

    

    //

    const navigate = useNavigate();


    const tokenBoughtFilter = { address: auction, topics: [ethers.utils.id("TokenBought(address,uint256,uint256)")] }


    useEffect(async () => {
        const { abi } = await import(`../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/${auctionType}.sol/${auctionType}.json`)
        const auctionContract = new ethers.Contract(auction, abi, provider)


        const imageResult = await getFileFromIpfs(state.fileHash, "image")
        setImageURL(URL.createObjectURL(imageResult.data))

        console.log("before refresh info")

        await refreshInfo(abi, auctionContract) //todo it would be better if backend did this



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
                                price={currentData?.currentPrice ?? startingPrice}
                                tokenDist={currentData?.tokenDist}
                                deposit={currentData?.soldTokens}
                                totalRaise={currentData?.totalDeposit}
                                startingDate={currentData?.startTime}
                                endingDate={currentData?.endTime}
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
                                    value={soldTokens / currentData.tokenDist * 100}
                                    text={parseFloat(soldTokens / tokenDist * 100).toFixed(4) + '%'}
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
            {auctionTypesForChart.includes(auctionType) && currentData  ?
                <PriceChart
                    currentData = {currentData}
                    historicData={historicData}
                    auctionType={auctionType}
                /> : null}
        </div>
    );
};

export default Auction;