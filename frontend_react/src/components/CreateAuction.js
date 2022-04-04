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

import UserContext from '../User';
import LoadingButton from './LoadingButton';
import ToastBar from './Toast';
import ProjectRegister from '../abi/project.json'
import Cookies from 'js-cookie'
import axios from "axios"
import abi from '../abi/project.json'
import {ethers} from 'ethers';
import ethersAbi from '../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'

import MaestroABI from '../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json';

import DutchAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/DutchAuction.sol/DutchAuction.json';

import FCFSAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/FCFSAuction.sol/FCFSAuction.json';

import FCFSLimitAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/FCFSLimitAuction.sol/FCFSLimitAuction.json';

import OBFCFSAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/OBFCFSAuction.sol/OBFCFSAuction.json';



import PseudoCappedAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/PseudoCappedAuction.sol/PseudoCappedAuction.json';

import UncappedAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/UncappedAuction.sol/UncappedAuction.json';

import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';

import { numberToFixedNumber } from '../helpers'; 


const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0xD25Bf7F0C712859F6e5ea48aB5c82174f81Bd233" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const CreateAuction = () => {

    const hash = useLocation()?.state?.hash



    
    const [isLoading, setLoading] = useState(false)
    const [auctionTypes, setAuctiontypes] = useState([
        {
            id: 1,
            name: "First come First Serve",
            description: "An auction where there is limited number of tokens being sold from the same price"
        },
        {
            id: 2,
            name: "Dutch",
            description: "This is an auction where a limited coins being sold while coin price decreases by time"
        }
        ,
        {
            id: 3,
            name: "Uncapped",
            description: "This is an auction where unlimited number of coins being sold for the same price"
        },
        {
            id: 4,
            name: "First come First Serve Limit",
            description: "This is a FCFS Auction but there is a limit of tokens an investor can buy"
        },
        {
            id: 5,
            name: "Pseudo Capped",
            description: "This is an auction where there is a limited amount of tokens but investors can invest unlimited amount of sucoins"
        },
        {
            id: 6,
            name: "Order Book First Come First Server",
            description: "Order book version (investors get their tokens when auction ends) of  First Come First Serve"
        },
        


    ]);

    const [auction, setAuction] = useState("")
    const [tokenPrice, setTokenPrice] = useState();
    const [tokenAddress, setTokenAddress] = useState();
    const [TokensToBeDesitributed, setTokensToBeDesitributed] = useState();



    const action1 = async () => {
        const provider = await new ethers.providers.Web3Provider(window.ethereum);

        const signer = await provider.getSigner();

        const MAESTRO = new ethers.ContractFactory(MaestroABI.abi, MaestroABI.bytecode, signer);

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

        let contract;


        if (id == 0) {
            const FCFS = new ethers.ContractFactory(FCFSAuction.abi, FCFSAuction.bytecode, signer);    
            let auction = await FCFS.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal,priceDecimal);
            contract = await auction.deployed();
        }
        else if (id == 1) {
            const Dutch = new ethers.ContractFactory(DutchAuction.abi, DutchAuction.bytecode, signer);    
            let auction = await Dutch.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal,priceDecimal,1);
            contract = await auction.deployed();
        }
        else if (id == 2) {
            const Uncapped = new ethers.ContractFactory(UncappedAuction.abi, UncappedAuction.bytecode, signer);    
            let auction = await Uncapped.deploy(tokenAddress,SUCoin.address,priceDecimal);
            contract = await auction.deployed();
        }

        else if (id == 3) {
            const FCFSLimit = new ethers.ContractFactory(FCFSLimitAuction.abi, FCFSLimitAuction.bytecode, signer);    
            let auction = await FCFSLimitAuction.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal,priceDecimal,1000);
            contract = await auction.deployed();
        }

        else if (id == 4) {
            const PseudoCappedAuction = new ethers.ContractFactory(PseudoCappedAuction.abi, PseudoCappedAuction.bytecode, signer);    
            let auction = await PseudoCappedAuction.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal);
            contract = await auction.deployed();
        }

        else if (id == 5) {
            const OBFCFSAuction = new ethers.ContractFactory(OBFCFSAuction.abi, OBFCFSAuction.bytecode, signer);    
            let auction = await OBFCFSAuction.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal,priceDecimal);
            contract = await auction.deployed();
        }


    

        else return;



        const MAESTRO = new ethers.ContractFactory(MaestroABI.abi, MaestroABI.bytecode, signer);

        const maestroContract = MAESTRO.attach(maestro.address);

        await maestroContract.AssignAuction(contract.address,hash,tokenAddress);


     
    }


    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        if (name === 'tokenPrice') setTokenPrice(value);

        if (name === 'tokenAddress') setTokenAddress(value);
        if (name === 'TokensToBeDesitributed') setTokensToBeDesitributed(value);
    };

    return (
        <>

            <Wrapper>


                <Container  >
                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Token Address">
                                <Form.Control onChange={handleInput} name="tokenAddress" value={tokenAddress} type="text" />
                            </FloatingLabel>
                        </Col>
                        <Col style={{ justifyContent: "center", alignItems: "center" }}>
                            <Button variant="dark" onClick={() => { action1() }}> Assign Token</Button>
                        </Col>
                    </Row >

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
                                                        <FloatingLabel controlId="floatingInputGrid" label="tokenAddress">
                                                            <Form.Control onChange={handleInput} name="tokenAddress" value={tokenAddress} type="text" />
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

                                                <br></br>
                                                <Row style={{ paddingLeft: "10%" }}>
                                                    <Col style={{ justifyContent: "center", alignItems: "center" }}>
                                                        <Button variant="dark" onClick={() => { action1() }}> Create</Button>
                                                    </Col>
                                                </Row>
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