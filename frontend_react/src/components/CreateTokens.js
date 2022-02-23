import React, { useState, useContext, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom';
import API from '../API';
import Select from 'react-select'
import { jsPDF } from "jspdf";
// Components
import MDEditor from "@uiw/react-md-editor";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
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
import ProjectRegister from '../abi/project.json'
import Cookies from 'js-cookie'
import axios from "axios"
import abi from '../abi/project.json'
import { ethers } from 'ethers';
import Token from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';

const CreateTokens = () => {
    const [tokenName, setTokenName] = useState();
    const [tokenSymbol, setTokenSymbol] = useState();
    const [totalSupply, setTotalSupply] = useState();

    const [toastShow, setToastshow] = useState(false);
    const [toastText, setToasttext] = useState();
    const [toastHeader, setToastheader] = useState();

    const action1 = async () => {
        try {
            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();

            let TokenFactory = new ethers.ContractFactory(Token.abi, Token.bytecode, signer);
            setToastshow(true)
            setToastheader("Signing the Transaction")
            setToasttext("Please sign the transaction from your wallet.")
            var tokenSC = await TokenFactory.deploy(tokenName, tokenSymbol, totalSupply, await signer.getAddress());

            setToastshow(false)
            setToastshow(true)
            setToastheader("Pending Transaction")
            setToasttext("Waiting for transaction confirmation.")
            await tokenSC.deployed();
            console.log("Your token deploye on address: %s", tokenSC.address);
            alert(tokenSC.address)
            setToastshow(false);
        } catch (error) {
            setToastshow(true)
            setToastheader("Catched an error")
            setToasttext(error)
            return false;
        }
    }

    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        if (name === 'tokenName') setTokenName(value);
        if (name === 'tokenSymbol') setTokenSymbol(value);
        if (name === 'totalSupply') setTotalSupply(value);

    };

    return (
        <>
            <Wrapper>
                <Container  >
                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Token Name">
                                <Form.Control onChange={handleInput} name="tokenName" type="text" />
                            </FloatingLabel>
                        </Col>
                    </Row >

                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Token Symbol">
                                <Form.Control onChange={handleInput} name="tokenSymbol" type="text" />
                            </FloatingLabel>
                        </Col>
                    </Row >

                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label="Total Supply">
                                <Form.Control onChange={handleInput} name="totalSupply" type="text" />
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
            </Wrapper >

        </>
    );
};



export default CreateTokens;