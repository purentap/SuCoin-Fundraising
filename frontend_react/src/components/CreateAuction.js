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



// Styles
import { Wrapper, WrapperFile } from './Projects.styles';
import Web3 from 'web3';

import LoadingButton from './LoadingButton';



import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"

import { ethers } from 'ethers';


import { numberToFixedNumber } from '../helpers'; 


const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0xDE764E4A7Caf779b7623B373955120C3D4e70Eef" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const CreateAuction = () => {

    const hash = useLocation()?.state?.hash



    
    const [isLoading, setLoading] = useState(false)
    const [auctionTypes, setAuctiontypes] = useState([
     
        {
            id: 0,
            name: "Uncapped Auction",
            description: "Fixed price unlimited tokens",
        },
        {
            id: 1,
            name: "Pseudo Capped Auction",
            description: "Fixed number of tokens but unlimited sucoins can be invested",
        },
        {
            id : 2,
            name: "Order book FCFS Auction",
            description: "FCFS Auction where users get their tokens at the end of auction"
        },
        {
            id : 3,
            name: "FCFS Limit Auction",
            description: "FCFS Auction where there is a limit in terms of sucoins that a user can invest"
        },
        {
            id : 4,
            name: "FCFS Auction",
            description: "First come first serve fixed price fixed supply token sale"
        },
        {
            id : 5,
            name: "Dutch Auction",
            description: "Similar to FCFS but price goes down with time"
        },
        {
            id:6,
            name: "Orderbook Dutch Auction",
            description: "Dutch Auction with ordebook"
        },
        {
            id:7,
            name: "Strict Dutch Auction",
            description: "Dutch Auction but supply decreases as well, burns the remaining coins instead of giving them to proposer"
        }

    ]);

    const [auction, setAuction] = useState("")
    const [tokenPrice, setTokenPrice] = useState();
    const [finalPrice,setFinalPrice] = useState();
    const [limit,setLimit] = useState();
    const [tokenAddress, setTokenAddress] = useState();
    const [TokensToBeDesitributed, setTokensToBeDesitributed] = useState();



    const action1 = async () => {
        const provider = await new ethers.providers.Web3Provider(window.ethereum);

        const signer = await provider.getSigner();

        const MAESTRO = new ethers.Contract(maestro, Maestro.abi, signer);

        const maestroContract = MAESTRO.attach(maestro.address)

        const address = await signer.getAddress()

        await maestroContract.assignToken(tokenAddress,hash)


    }



    const deployAuction = async (id) => {
        const sucoinDecimals = 18  //todo get this value from blockchain
        const provider = await new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        const tokenDistributedDecimal = numberToFixedNumber(TokensToBeDesitributed,sucoinDecimals)
        const priceDecimal = numberToFixedNumber(tokenPrice,sucoinDecimals);
        

        const finalRate = numberToFixedNumber(finalPrice,sucoinDecimals);

        const maestroContract = new ethers.Contract(maestro.address,Maestro.abi,signer)

        const auctionType = ["UncappedAuction","PseudoCappedAuction","OBFCFSAuction","FCFSLimitAuction","FCFSAuction","DutchAuction","OBDutchAuction","StrictDutchAuction"][id]
        console.log(auctionType)
        maestroContract.createAuction(hash,auctionType,[tokenDistributedDecimal,priceDecimal,finalRate,limit])        
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

                </Container>
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