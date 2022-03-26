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
import CappedFCFS from '../contracts_hardhat/artifacts/contracts/CappedFCFSAuction.sol/CappedFCFSAuction.json';
import CappedParcelLimitFCFS from '../contracts_hardhat/artifacts/contracts/CappedParcelLimitFCFSAuction.sol/CappedParcelLimitFCFSAuction.json';
import CappedAuctionWRedistribution from '../contracts_hardhat/artifacts/contracts/CappedAuctionWRedistribution.sol/CappedAuctionWRedistribution.json';
import DutchAuction from '../contracts_hardhat/artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import DutchAuctionTrial from '../contracts_hardhat/artifacts/contracts/DutchAuctionTrial.sol/DutchAuctionTrial.json';

import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';

import { numberToFixedNumber } from '../helpers'; 


const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0x1cFc7B3ec115cF51DB35AEC04Ce902dd1Cb3625b" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const CreateAuction = () => {

    const hash = useLocation()?.state?.hash



    
    const [isLoading, setLoading] = useState(false)
    const [auctionTypes, setAuctiontypes] = useState([
        {
            id: 0,
            name: "Dutch Auction",
            description: "this is DUTCH Auction"
        },
        {
            id: 1,
            name: "First Come First Served",
            description: "This is First come first served"
        }
        ,
        {
            id: 2,
            name: "Weighted",
            description: "this Weighted"
        }
        ,
        {
            id: 3,
            name: "Parcel Limit",
            description: "this is Parcel Limit"
        },
        {
            id: 4,
            name: "Dutch Auction Trial",
            description: "An Auction where price decrease constantly"
        }
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


        if (id == 0) {
            const DutchAuction_ = new ethers.ContractFactory(DutchAuction.abi, DutchAuction.bytecode, signer);
            let auction = await DutchAuction_.deploy(10, 1, tokenAddress, TokensToBeDesitributed, SUCoin.address, 2, maestro.address, auction.fileHash);
            await auction.deployed();
        }
        else if (id == 1) {
            const CappedFCFSAuction = new ethers.ContractFactory(CappedFCFS.abi, CappedFCFS.bytecode, signer);
            let auction = await CappedFCFSAuction.deploy(tokenPrice, tokenAddress, SUCoin.address, TokensToBeDesitributed, maestro.address, auction.fileHash);
            await auction.deployed();
        }
        else if (id == 2) {
            const CappedFixedPriceProportionalAuction = new ethers.ContractFactory(CappedAuctionWRedistribution.abi, CappedAuctionWRedistribution.bytecode, signer);
            let auction = await CappedFixedPriceProportionalAuction.deploy(tokenPrice, tokenAddress, SUCoin.address, TokensToBeDesitributed, maestro.address, auction.fileHash);
            await auction.deployed();
        }
        else if (id == 3) {
            const CappedParcelLimitFCFSAuction = new ethers.ContractFactory(CappedParcelLimitFCFS.abi, CappedParcelLimitFCFS.bytecode, signer);
            let auction = await CappedParcelLimitFCFSAuction.deploy(tokenPrice, tokenAddress, SUCoin.address, TokensToBeDesitributed, 1000, maestro.address, auction.fileHash);
            await auction.deployed();
        }
        else if (id == 4) {
            const Dutch = new ethers.ContractFactory(DutchAuctionTrial.abi, DutchAuctionTrial.bytecode, signer);    
            let auction = await Dutch.deploy(tokenAddress,SUCoin.address,tokenDistributedDecimal,priceDecimal,maestro.address,hash ?? "fail",0);
            await auction.deployed();
        }
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