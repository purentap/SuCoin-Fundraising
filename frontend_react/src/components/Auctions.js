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


import ToastBar from './Toast';
import Cookies from 'js-cookie'
import axios from "axios"
import { ethers } from 'ethers';


import Auction from "../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/Auction.sol/Auction.json"
import ERC20MintableUpgradeable from "../contracts_hardhat/artifacts/contracts/UpgradeableTokens/ERC20MintableUpgradeable.sol/ERC20MintableUpgradeable.json"
import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"


const options = [
    { value: 'fens', label: 'FENS' },
    { value: 'fass', label: 'FASS' },
    { value: 'fman', label: 'FMAN' }
]

const MaestroAddress = "0x0f5c10458D42ED60b79dBbec30d26Db694646D73";

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
            var MAESTRO = await new ethers.Contract(MaestroAddress, Maestro.abi, provider);

            var filter = await MAESTRO.filters.CreateAuctionEvent();
            var allCreateAuctionEvents = await MAESTRO.queryFilter(filter);



            const wantedInformation = ["id","auctionAddress","fileHash","auctionType","creator","status","tokenSymbol","tokenName"]
 
            
          const auctionData =  Promise.all(allCreateAuctionEvents.map(async auctionEvent => {
                const {auction,fileHash,auctionType,creator} = auctionEvent.args;
                const auctionContract =  new ethers.Contract(auction,Auction.abi,provider)

                 const statusPromise = auctionContract.status()
                                        .then(status => ["notStarted","Ongoing","Finished"][status]) 


                const tokenPromise =   MAESTRO.projectTokens(fileHash)
                                            .then(addresses => new ethers.Contract(addresses.token,ERC20MintableUpgradeable.abi,provider))
                                            .then(contract => Promise.all([contract.symbol(),contract.name()]))

                 
                
                const id = hashToId[fileHash]
                

                
                return Promise.all([id,auction,fileHash,auctionType,creator,statusPromise,tokenPromise])
                              .then(result => result.flat())
                              .then(resultFlat => Object.fromEntries(wantedInformation.map((_,i) => [wantedInformation[i],resultFlat[i]])))

            }))


            setAuctions(await auctionData)
          

            


     


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

    const navigate = useNavigate();


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

                                            <Button onClick={() => navigate('/auction/' + project.id,{state:project})}>
                                                Auction Page
                                            </Button>
                                       

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