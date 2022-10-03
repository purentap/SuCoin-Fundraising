import React, { useState, useContext, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../API';
import Select from 'react-select'
import { jsPDF } from "jspdf";
// Components
import MDEditor from "@uiw/react-md-editor";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Accordion from 'react-bootstrap/Accordion'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import Card from 'react-bootstrap/Card'
import axios from 'axios'
import Cookies from 'js-cookie'


// Styles
import { Wrapper, WrapperFile } from './Projects.styles';
import Web3 from 'web3';

import LoadingButton from './LoadingButton';



import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"

import { ethers } from 'ethers';


import { numberToFixedNumber } from '../helpers'; 


const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0xce64DF42adcD1bd615bBc8404D4E104b782a6B84" }
const SUCoin = { address: "0x142E19B79A0101Dd5B382793D6D377Fd7df6365D" }

const CreateAuction = () => {


    const hash = useLocation()?.state?.hash
    const projectId =  useLocation()?.state?.id

    console.log(hash,projectId)



    
    const [isLoading, setLoading] = useState(false)
    const [auctionTypes, setAuctiontypes] = useState([
     
        {
            id: 0,
            name: "Uncapped Auction",
            description: "Fixed price unlimited tokens only need the first parameter",
        },
        {
            id: 1,
            name: "Pseudo Capped Auction",
            description: "Fixed number of tokens but unlimited sucoins can be invested which will be distributed in the end burns all tokens if no one invests",
        },
        {
            id : 2,
            name: "Order book FCFS Auction",
            description: "FCFS Auction where users get their tokens at the end of auction"
        },
        {
            id : 3,
            name: "FCFS Auction",
            description: "First come first serve, fixed price fixed supply token sale"
        },
        {
            id : 4,
            name: "Dutch Auction",
            description: "Fixed supply token auction with price going down to finalPrice linearly over the duration last parameter is ignored"
        },
        {
            id:5,
            name: "Orderbook Dutch Auction",
            description: "Investors can bid their price to tokens, at the end of the auction tokens will be distributed starting from the highest bid until all sold tokens are distributed, price parameters ignored"
        },
        {
            id:6,
            name: "Strict Dutch Auction",
            description: "Dutch Auction but supply decreases linearly as well, burns the remaining coins instead of giving them to proposer"
        }

    ]);

    

    const [auction, setAuction] = useState("")
    const [tokenPrice, setTokenPrice] = useState();
    const [finalPrice,setFinalPrice] = useState();
    const [limit,setLimit] = useState();
    const [tokenAddress, setTokenAddress] = useState();
    const [TokensToBeDesitributed, setTokensToBeDesitributed] = useState();




    const updateDatabase = async () => {

 try {

    console.log("w")
    
          const apiInstance = axios.create({
            baseURL: "https://localhost:5001",
          })
          apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
          let response2 = new Promise((resolve, reject) => {
            apiInstance
              .put(`/Project/CreateAuction/${projectId}`)
              .then((res) => {
                console.log("response: ", res.data)
                resolve(res)
              })
              .catch((e) => {
                const err = "Unable to create an auction in database"
                reject(err)
    
              })
          })
          let result = await response2
          console.log(result)
    
    
        } catch (error) {
          console.log(error)
        }
    }


   



    const deployAuction = async (id) => {
        const sucoinDecimals = 18  //todo get this value from blockchain
        const provider = await new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const tokenDistributedDecimal = numberToFixedNumber(TokensToBeDesitributed,sucoinDecimals)
        const priceDecimal = numberToFixedNumber(tokenPrice,sucoinDecimals);
        const limitDecimal = numberToFixedNumber(limit,sucoinDecimals);

        

        const finalRate = numberToFixedNumber(finalPrice,sucoinDecimals);

        const maestroContract = new ethers.Contract(maestro.address,Maestro.abi,signer)

        const auctionType = ["UncappedAuction","PseudoCappedAuction","OBFCFSAuction","FCFSAuction","DutchAuction","OBDutchAuction","StrictDutchAuction"][id]
        
        const tx = await maestroContract.createAuction(hash,auctionType,[tokenDistributedDecimal,priceDecimal,finalRate,limitDecimal])  
        await tx.wait(1)
        console.log("x")
        await updateDatabase()  


    }


    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        if (name === 'tokenPrice') setTokenPrice(value);

        if (name == "finalPrice") setFinalPrice(value);

        if (name == "limit") setLimit(value);

        if (name === 'TokensToBeDesitributed') setTokensToBeDesitributed(value);
    };

    return (
        <>

            <Wrapper>
            {(projectId && hash) ? 
            


                <Container  >
             

                    {

                        auctionTypes.map((type, index) => (
                            <Col>
                                <Accordion defaultActiveKey="0" >
                                    <Accordion.Item eventKey={index}>
                                        <Accordion.Header> {type.name}        </Accordion.Header>
                                        <Accordion.Body>
                                            {type.description}
                                            <Container  >
                                                <Row className="g-2">
                                                    <Col md>
                                                        <FloatingLabel controlId="floatingInputGrid" label="price">
                                                            <Form.Control onChange={handleInput} name="tokenPrice" type="text" />
                                                        </FloatingLabel>
                                                    </Col>
                                                </Row >

                                                <Row className="g-2">
                                                    <Col md>
                                                        <FloatingLabel controlId="floatingInputGrid" label="finalPrice">
                                                            <Form.Control onChange={handleInput} name="finalPrice" type="text" />
                                                        </FloatingLabel>
                                                    </Col>
                                                </Row >

                                                
                                               

                                                <Row className="g-2">
                                                    <Col md>
                                                        <FloatingLabel controlId="floatingInputGrid" label="#TokensToBeDesitributed">
                                                            <Form.Control onChange={handleInput} name="TokensToBeDesitributed" type="text" />
                                                        </FloatingLabel>
                                                    </Col>
                                                </Row >
                                                
                                                <Row className="g-2">
                                                    <Col md>
                                                        <FloatingLabel controlId="floatingInputGrid" label="#limit">
                                                            <Form.Control onChange={handleInput} name="limit" type="text" />
                                                        </FloatingLabel>
                                                    </Col>
                                                </Row >

                                                <br></br>
                                           
                                            </Container>


                                            <LoadingButton show={isLoading} text={"Submit to Chain"} variant="dark" func={() => { deployAuction(index) }}>Deploy Auction </LoadingButton>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            </Col>
                        ))


                    }

                </Container> : "Please enter from project details page"
            } 
            </Wrapper >

        </>
    );
};


/*

  <Container  >
                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Var1">
                                <Form.Control onChange={handleInput} name="var1" type="text" />
                            </FloatingLabel>
                        </Col>
                    </Row >

                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Var2">
                                <Form.Control onChange={handleInput} name="var2" type="text" />
                            </FloatingLabel>
                        </Col>
                    </Row >


                    <br></br>
                    <Row style={{ paddingLeft: "10%" }}>
                        <Col style={{ justifyContent: "center", alignItems: "center" }}>
                            <Button variant="dark" onClick={() => { action1() }}> Action 1</Button>
                        </Col>
                        <Col style={{ justifyContent: "center", alignItems: "center" }}>
                            <Button variant="dark" onClick={() => { action2() }}> Action 2</Button>
                        </Col>
                    </Row>
                </Container>

                */
export default CreateAuction;