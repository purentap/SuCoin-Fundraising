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

const options = [
    { value: 'fens', label: 'FENS' },
    { value: 'fass', label: 'FASS' },
    { value: 'fman', label: 'FMAN' }
]

const MaestroAddress = "0x4ED02B5dA043d8c9882f11B9784D67f2a7E9cC7C";
const CappedFCFSAddress = "0x43f691a5D43Dd8edbDa222c6a0de967E52a23db2"

const IDs = []

const Auctions = () => {
    const [auctions, setAuctions] = useState([
        {
            "auctionAddress": "0x98f2C2aFB088bE9378a4dEb2672Af309E9b65329",
            "fileHash": "0xa190d2b3a3323f420e5df6078d27bf6d7d76144aea19e32cb66ff61b4ad07d2d",
            "auctionType": "CappedFCFS",
            "creator": "0xDE02A36403d7a38eB9D6a8568599Ef6CDf18315b",
            "tokenSymbol": "Lira",
            "tokenName": "BiLira",
            "status": "notStarted",
            "tokenAddress": "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3"
        },
        {
            "auctionAddress": "0x38a758A743Df330182Aa3988090d40b791823255",
            "fileHash": "0x4fd063a659cd3fe36b2ae58f30c5b7e36e5b0e10fcc2e447ebd76a5443ea2689",
            "auctionType": "CappedFCFS",
            "creator": "0xDE02A36403d7a38eB9D6a8568599Ef6CDf18315b",
            "tokenSymbol": "Lira",
            "tokenName": "BiLira",
            "status": "notStarted",
            "tokenAddress": "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3"
        }
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
                let auctionSc = await new ethers.Contract(aucAddress, (auctionType == 'CappedFCFS' ? CappedFCFS.abi : (auctionType == 'CappedAuctionWRedistribution' ? CappedAuctionWRedistribution.abi : (auctionType == "CappedParcelLimitFCFSAuction" ? CappedParcelLimitFCFS.abi : (auctionType == "DutchAuction" ? DutchAuction : DutchAuction)))), provider);
                let isFinished = await auctionSc.isFinished();
                let isStarted = await auctionSc.isStarted();
                var status;
                if (isStarted && !isFinished) {
                    status = "Ongoing";
                }
                else if (isStarted && isFinished) {
                    status = "Finished";
                } else if (!isStarted) {
                    status = "notStarted";
                }

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
            setToasttext(error)
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