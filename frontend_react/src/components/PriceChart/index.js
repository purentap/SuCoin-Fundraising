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
} from 'chart.js';
import { Line } from 'react-chartjs-2';



const PriceChart = ({auctionType, startTime, latestEndTime, initialRate, finalRate, initialSupply}) => {

    const realTime = Date.now();

    const timeDifference = realTime / 1000 - startTime;

    console.log("Final Rate", finalRate)

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
    );

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
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
                data: timestamps.map((realTime) => Math.max(finalRate,(initialRate - ((initialRate  - finalRate ) * (realTime / 1000 - startTime))  /  (latestEndTime - startTime)))),
                function: function(realTime) {return (initialRate - ((initialRate  - finalRate ) * (realTime / 1000 - startTime))  /  (latestEndTime - startTime))},
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Total Supply',
                data: timestamps.map((realTime) => Math.max(0,(initialSupply - (initialSupply) * (realTime / 1000 - startTime)  /  (latestEndTime - startTime)))),
                function: function(realTime) {return (initialSupply) * (realTime / 1000 - startTime)  /  (latestEndTime - startTime)},
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
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

    const labels = timestamps.map((timestamp) => timestamp.toLocaleString())

    const data = {
        labels,
        datasets: auctionTypesForChart[auctionType],
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