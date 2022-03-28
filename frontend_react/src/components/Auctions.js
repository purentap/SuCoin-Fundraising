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
import Web3 from 'web3';

import UserContext from '../User';
import LoadingButton from './LoadingButton';
import ToastBar from './Toast';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie'
import axios from "axios"
import { ethers } from 'ethers';
import MaestroABI from '../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json';
import CappedFCFS from '../contracts_hardhat/artifacts/contracts/CappedFCFSAuction.sol/CappedFCFSAuction.json';
import CappedParcelLimitFCFS from '../contracts_hardhat/artifacts/contracts/CappedParcelLimitFCFSAuction.sol/CappedParcelLimitFCFSAuction.json';
import CappedAuctionWRedistribution from '../contracts_hardhat/artifacts/contracts/CappedAuctionWRedistribution.sol/CappedAuctionWRedistribution.json';
import DutchAuction from '../contracts_hardhat/artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';

import AuctionTrial from '../contracts_hardhat/artifacts/contracts/AuctionTrial.sol/AuctionTrial.json';


import DutchAuctionTrial from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/DutchAuctionTrial.sol/DutchAuctionTrial.json';

import CappedAuctionTrial from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/CappedAuctionTrial.sol/CappedAuctionTrial.json';

import UncappedAuctionTrial from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/UncappedAuctionTrial.sol/UncappedAuctionTrial.json';

const options = [
    { value: 'fens', label: 'FENS' },
    { value: 'fass', label: 'FASS' },
    { value: 'fman', label: 'FMAN' }
]

const MaestroAddress = "0xD25Bf7F0C712859F6e5ea48aB5c82174f81Bd233";
const CappedFCFSAddress = "0x43f691a5D43Dd8edbDa222c6a0de967E52a23db2"

const IDs = []

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



    useEffect(async () => {
        try {
            const CryptoJS = require('crypto-js');
            const apiInstance = axios.create({
                baseURL: "https://localhost:5001",
            })
            apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
            let response2 = new Promise((resolve, reject) => {
                apiInstance
                    .get("/Project/Get")
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
            console.log("ehee", result.data.data)
            setProjects(result.data.data)



            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            var Maestro = await new ethers.Contract(MaestroAddress, MaestroABI.abi, provider);

            var filter = await Maestro.filters.CreateAuctionEvent();

            var allCreateAuctionEvents = await Maestro.queryFilter(filter);
            console.log(allCreateAuctionEvents)
            var allAuctions = [];
            for (let index = 0; index < allCreateAuctionEvents.length; index++) {
                let aucAddress = allCreateAuctionEvents[index].args.auction;
                let fileHash = allCreateAuctionEvents[index].args.fileHash;
                let auctionType = allCreateAuctionEvents[index].args.auctionType;
                let creator = allCreateAuctionEvents[index].args.creator;
                let Project = await Maestro.projectTokens(fileHash);
                let tokenSC = await new ethers.Contract(Project.token, TokenABI.abi, provider);
                let tokenSymbol = await tokenSC.symbol();
                let tokenName = await tokenSC.name();
                let auctionSc = await new ethers.Contract(aucAddress, AuctionTrial.abi, provider);
                const status = ["notStarted","Ongoing","Finished"][await auctionSc.status()]
                
                var id
                result.data.data.forEach(proj => {
                    //console.log("XX", auct.fileHash, " VS ", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                    if (fileHash == "0x" + CryptoJS.SHA256(proj.fileHex).toString()) {
                        console.log("match", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                        console.log(proj.projectID)
                        id = proj.projectID

                    }
                })

                allAuctions.push({ "id": id, "auctionAddress": aucAddress, "fileHash": fileHash, "auctionType": auctionType, "creator": creator, "tokenSymbol": tokenSymbol, tokenName: tokenName, status: status, tokenAddress: Project.token });
            }
            setAuctions(allAuctions)
            console.log(allAuctions);


            /*var allTokenCreationEvents = await Maestro.filters.TokenCreation();
            console.log(allTokenCreationEvents);*/

        } catch (error) {
            setToastshow(true)
            setToastheader("Catched an error")
            setToasttext(error?.message)
            return false;
        }
    }, [])
    /*
        useEffect(async () => {
            const CryptoJS = require('crypto-js');
            try {
                const apiInstance = axios.create({
                    baseURL: "https://localhost:5001",
                })
                apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
                let response2 = new Promise((resolve, reject) => {
                    apiInstance
                        .get("/Project/Get")
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
                console.log("ehee", result.data.data)
                setProjects(result.data.data)
    
                let i = 0
                auctions.forEach(auct => {
    
                    result.data.data.forEach(proj => {
                        //console.log("XX", auct.fileHash, " VS ", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                        if (auct.fileHash == "0x" + CryptoJS.SHA256(proj.fileHex).toString()) {
                            console.log("match", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                            console.log(proj.projectID)
    
                            IDs.push(proj.projectID)
                        }
                        else {
                            IDs.push(99999)
                        }
                        i++;
                    });
                });
    
    
    
            } catch (error) {
                console.log(error)
            }
    
    
        }, [auctions])
    */
    const action2 = () => {
        console.log("AYDISS", IDs)
    }

    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        // if (name === 'var1') setVar1(value);
        if (name === 'var2') setVar2(value);
        if (name === 'var3') setVar3(value);
        if (name === 'var4') setVar4(value);
        if (name === 'var5') setVar5(value);

    };

    return (
        <>
            <ToastBar toastText={toastText} toastHeader={toastHeader} toastShow={toastShow} setToastshow={setToastshow}></ToastBar>
            <Wrapper>



                <Container  >
                    <Row>
                        {

                            auctions.map((project, index) => (
                                <Col>
                                    <Card style={{ width: '18rem' }}>

                                        <Card.Body>
                                            <Card.Title>{"Auction of Project # " + project.id}</Card.Title>
                                            <Card.Text>
                                                {"Auction Type: " + project.auctionType}

                                            </Card.Text>
                                            <Card.Text>
                                                {"Auction Status: " + project.status}
                                            </Card.Text>
                                            <Card.Text>

                                                {"Token Name: " + project.tokenName + '(' + project.tokenSymbol + ')'}

                                            </Card.Text>

                                            <Link to={'/auction/' + project.id} >
                                                Auction Page
                                            </Link >

                                        </Card.Body>
                                    </Card>
                                </Col>
                            )
                            )

                        }
                    </Row>
                </Container>
            </Wrapper >


        </>
    );
};



export default Auctions;