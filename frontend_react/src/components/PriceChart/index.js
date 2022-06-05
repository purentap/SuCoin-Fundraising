import React, { useEffect, useState } from 'react';


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
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import 'chartjs-adapter-date-fns';
import star from 'react-rating-stars-component/dist/star';

 


const PriceChart = ({auctionType, currentData,historicData}) => {


    console.log(currentData)
    console.log(auctionType)
    console.log(historicData)

    const { startTime, currentRate,latestEndTime,currentSupply ,initialRate, finalRate,currentRaise, initialSupply,soldTokens} = currentData;
    const realTime = Date.now();


    const timeDifference = realTime / 1000 - startTime;

    console.log("Final Rate", finalRate)



  
 console.log(historicData)





    ChartJS.register(
        CategoryScale,
        LinearScale,
        TimeScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
    );

    console.log(initialRate)

    const options = {
        responsive: true,
        //Create scale with moment.js
        scales: {

            x: {
                
                type: 'linear',
                min : parseFloat(startTime) * 1000,
                max : new Date() - new Date(null),
                ticks : {
                    count : 5,
                    callback: function(value) { 
                        return new Date(value).toLocaleDateString('en-US', {month:'short', year:'numeric', day:'numeric', hour:'numeric', minute:'numeric'}); 
                    },
                }
            },
          
        },
     

        plugins: {
          
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
               
                    title: function(context) {
                    
                        if (context[0].parsed !== null) {
                            return new Date(context[0].parsed.x).toLocaleDateString('en-US', {month:'short', year:'numeric', day:'numeric', hour:'numeric', minute:'numeric'}); 
                        }
                    }
                }
            }
        },
    };

        const timestamps = [new Date(startTime * 1000), 
        new Date(startTime * 1000 + 1*timeDifference/5 * 1000), 
        new Date(startTime * 1000 + 2*timeDifference/5 * 1000),  
        new Date(startTime * 1000 + 3*timeDifference/5 * 1000), 
        new Date(startTime * 1000 + 4*timeDifference/5 * 1000),
        new Date(realTime)]; 

    const auctionTypesForChart = {
        "DutchAuction":[
            {
                label: 'Token Price',
                data: timestamps.map((realTime) => (Math.max(finalRate,initialRate - ((initialRate  - finalRate ) * (realTime / 1000 - startTime))  /  (latestEndTime - startTime)))),
                function: function(realTime) {return (initialRate - ((initialRate  - finalRate ) * (realTime / 1000 - startTime))  /  (latestEndTime - startTime))},
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ], 
        "OBFCFSAuction":[
            {
                label: 'Token Price',
                function: function(realTime) {return initialRate},
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'SUCoin Supply',
                function: function(x) {return x**3}, // Update this function later
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ], 
        "PseudoCappedAuction":[
            {
                label: 'Token Price',
                function: function(x) {return x**3}, // Update this function laters
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'SUCoin Supply',
                function: function(x) {return x**3}, // Update this function later
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
        ], 
        "StrictDutchAuction":[
            {
                label: 'Token Price',
                data:  Array.from(historicData.get("currentRate")),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Total Supply',
                data: Array.from(historicData.get("numberOfTokensToBeDistributed")),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
            label: 'Total Raised',
            data: Array.from(historicData.get("totalDepositedSucoins")),
            borderColor: 'rgb(20, 72, 25)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },

        ], 
        "UncappedAuction":[
            {
                label: 'Total ',
                function: function(x) {return x**3}, // Update this function later
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ]
    };

    //const labels = timestamps.map((timestamp) => timestamp.toLocaleString())

    const data = {
        datasets: auctionTypesForChart[auctionType]
    };



    return (
        <div>
            <div className='chart' style={{ width: '80%', margin: "auto" }}>
                <div className="sectionName" style={{ textAlign: 'center' }}>{"Token Information Chart"}</div>
                <br></br>
                <Line options={options} data={data} />
            </div>
            <br></br>
            <br></br>
        </div>
    );
}

export default PriceChart;