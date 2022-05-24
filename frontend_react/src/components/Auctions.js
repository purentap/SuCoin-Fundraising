import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom';
import API from '../API';
import Select from 'react-select'
import { jsPDF } from "jspdf";
// Components
import MDEditor from "@uiw/react-md-editor";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Card from 'react-bootstrap/Card'
import Row from 'react-bootstrap/Row'

import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
// Styles
import { Wrapper, WrapperFile } from './Projects.styles';

import AuctionCard from "./AuctionCard/AuctionCard";


import ToastBar from './Toast';
import Cookies from 'js-cookie'
import axios from "axios"
import { ethers } from 'ethers';


import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"

import LoadingIcon from './LoadingIcon';


const options = [
    { value: 'fens', label: 'FENS' },
    { value: 'fass', label: 'FASS' },
    { value: 'fman', label: 'FMAN' }
]

const MaestroAddress = "0x9995B9d98985a87e1C2Ed7b35549a49974A65A18";

const IDs = []

const provider = new ethers.providers.Web3Provider(window.ethereum);
var MAESTRO = new ethers.Contract(MaestroAddress, Maestro.abi, provider);

export const getAuctionByStatus = async (status, count) => {
    const CryptoJS = require('crypto-js');
    const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
    })
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
        apiInstance
            .get("/Project/Get/All")
            .then((res) => {
                console.log("response: ", res.data)
                resolve(res)
            })
            .catch((e) => {
                const err = "Unable to add the project"
                reject(err)

            })
    })
    let result = await response2

    const hashToProject = Object.fromEntries(result.data.data.map(project => [("0x" + project.fileHash).toLowerCase(), project]))
    const auctionData = await MAESTRO.getProjectSurfaceByStatus(Object.keys(hashToProject), status, count ?? result.data.data.length)
    const auctionDataCombined = auctionData.filter(auction => auction.auctionType != "").map(auction => {

        let newAuction = Object.assign([], auction)
        Object.assign(newAuction, (({ projectName, projectDescription, imageUrl, projectID, fileHash }) => ({ projectName, projectDescription, imageUrl, projectID, fileHash }))(hashToProject[auction.projectHash.toLowerCase()]))
        return newAuction
    })

    return auctionDataCombined
}

const Auctions = () => {
    const [auctions, setAuctions] = useState([

    ]);

    const [var2, setVar2] = useState();
    const [var3, setVar3] = useState();
    const [var4, setVar4] = useState();
    const [var5, setVar5] = useState();

    const [toastShow, setToastshow] = useState(false);
    const [toastText, setToasttext] = useState();
    const [toastHeader, setToastheader] = useState();
    const [projects, setProjects] = useState();

    const [isLoading, setIsLoading] = useState(true);



    useEffect(async () => {
        try {
            setAuctions(await getAuctionByStatus(1))
            setIsLoading(false);
        }
        catch (error) {
            setToastshow(true)
            setToastheader("Catched an error")
            setToasttext(error.message)
            return false;


        }

    }
        , [])


    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        // if (name === 'var1') setVar1(value);
        if (name === 'var2') setVar2(value);
        if (name === 'var3') setVar3(value);
        if (name === 'var4') setVar4(value);
        if (name === 'var5') setVar5(value);

    };

    const navigate = useNavigate();


    return (
        isLoading ?
            <div className={'home-page'}>
                <div className="sectionName" style={{ paddingLeft: "50px", paddingTop: "25px", paddingBottom: "25px" }}>Auctions</div>
                <LoadingIcon />
            </div>
            :
            <div>
                <div className="sectionName" style={{ paddingLeft: "50px", paddingTop: "25px", paddingBottom: "25px" }}>Auctions</div>
                <ToastBar toastText={toastText} toastHeader={toastHeader} toastShow={toastShow} setToastshow={setToastshow}></ToastBar>

                <br></br>

                <div style={{ width: "90%", textAlign: "center", margin: "auto" }}>
                    <div class="grid-container" style={{ display: 'grid' }}>
                        {auctions.map((project, index) => (
                            <div>
                                <AuctionCard
                                    project={project}
                                    fileHash={project.fileHash}
                                    imageUrl={project.imageUrl}
                                    projectName={project.projectName}
                                    projectDescription={project.projectDescription}
                                    auctionType={project.auctionType}
                                    tokenName={project.tokenName}
                                    totalFund={"N/A"}
                                    projectID={project.projectID}
                                />
                            </div>
                        ))
                        }
                    </div>
                </div>
            </div>
    );
};



export default Auctions;