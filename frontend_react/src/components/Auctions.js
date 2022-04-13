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
import DutchAuctionTrial from "../contracts_hardhat/artifacts/contracts/DutchAuctionTrial.sol/DutchAuctionTrial.json"
import AuctionTrial from "../contracts_hardhat/artifacts/contracts/AuctionTrial.sol/AuctionTrial.json"

const options = [
    { value: 'fens', label: 'FENS' },
    { value: 'fass', label: 'FASS' },
    { value: 'fman', label: 'FMAN' }
]

const MaestroAddress = "0xDD17723B9d6D6D3bEbE5046F54ea8F3e8089771a";

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
                    .get("/Project/Get/All/False")
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

            const hashToId = Object.fromEntries(result.data.data.map(project => ["0x" + project.fileHex,project.projectID]))





            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            var Maestro = await new ethers.Contract(MaestroAddress, MaestroABI.abi, provider);

            var filter = await Maestro.filters.CreateAuctionEvent();
            var allCreateAuctionEvents = await Maestro.queryFilter(filter);



            const wantedInformation = ["id","auctionAddress","fileHash","auctionType","creator","status","tokenSymbol","tokenName"]
 
            
          const auctionData =  Promise.all(allCreateAuctionEvents.map(async auctionEvent => {
              console.log(auctionEvent.args)
                const {auction,fileHash,auctionType,creator} = auctionEvent.args;
                const auctionContract =  new ethers.Contract(auction,AuctionTrial.abi,provider)

                 const statusPromise = auctionContract.status()
                                        .then(status => ["notStarted","Ongoing","Finished"][status]) 


                const tokenPromise =   Maestro.projectTokens(fileHash)
                                            .then(addresses => new ethers.Contract(addresses.token,TokenABI.abi,provider))
                                            .then(contract => Promise.all([contract.symbol(),contract.name()]))

                 
                
                const id = hashToId[fileHash]
                

                
                return Promise.all([id,auction,fileHash,auctionType,creator,statusPromise,tokenPromise])
                              .then(result => result.flat())
                              .then(resultFlat => Object.fromEntries(wantedInformation.map((_,i) => [wantedInformation[i],resultFlat[i]])))

            }))

            await auctionData

            //setAuctions(await auctionData)
          

            


     


            }
            catch (error) {
                setToastshow(true)
                setToastheader("Catched an error")
                setToasttext(error?.message)
                console.log(error)
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