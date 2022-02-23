import React, { useState, useContext, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import API from '../API';
import Select from 'react-select'
import { jsPDF } from "jspdf";
// Components
import MDEditor from "@uiw/react-md-editor";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Col';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import ToastBar from './Toast';
// Styles
import { Wrapper, WrapperFile } from './Projects.styles';
import Web3 from 'web3';

import UserContext from '../User';
import LoadingButton from './LoadingButton';
import ProjectRegister from '../abi/project.json'
import Cookies from 'js-cookie'
import axios from "axios"
import abi from '../abi/project.json'
import { ethers } from 'ethers';
import wrapperTokenABI from '../contracts_hardhat/artifacts/contracts/WrapperToken.sol/WrapperToken.json';
import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';

const wrapperTokenAddress = "0xa011037b3EF5EFd8e98D619e4E2fB8CB0a6acE9E";
const BiLiraAddress = "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const TokenSwap = () => {

    const [tokens, setTokens] = useState(["SUCoin", "BiLira"])
    const [amount, setAmount] = useState();
    const [asset, setAsset] = useState(tokens[0]);

    const [toastShow, setToastshow] = useState(false);
    const [toastText, setToasttext] = useState();
    const [toastHeader, setToastheader] = useState();

    const swapTokens = async () => {
        console.log(amount)
        if (tokens[0] == "BiLira") {
            action1()
        } else { action2() }
    }

    const action1 = async () => {
        try {

            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();

            const value = ethers.utils.parseUnits(amount, 18);

            var BiLiraContract = await new ethers.Contract(BiLiraAddress, TokenABI.abi, signer);
            var SUCoinContract = await new ethers.Contract(wrapperTokenAddress, wrapperTokenABI.abi, signer);

            //console.log("done", ethers.parseUnits(value, "gwei"))
            setToastshow(true)
            setToastheader("Signing the Transaction")
            setToasttext("Please sign the transaction from your wallet.")
            var approveTx = await BiLiraContract.approve(wrapperTokenAddress, value);

            setToastshow(false)
            setToastshow(true)
            setToastheader("Pending Transaction")
            setToasttext("Waiting for transaction confirmation.")
            let receipt = await approveTx.wait(1);

            setToastshow(false)
            setToastshow(true)
            setToastheader("Signing the Transaction");
            setToasttext("Please sign the transaction from your wallet.");

            var buyTx = await SUCoinContract.depositFor(await signer.getAddress(), value);

            setToastshow(false);
            setToastshow(true);
            setToastheader("Pending Transaction");
            setToasttext("Waiting for transaction confirmation.");

            receipt = await buyTx.wait(1);

            setToastshow(false)
            setToastshow(true)
            setToastheader("Success")
            setToasttext("Succesfuly bought %s SUCoin." + amount);
            console.log("done", receipt)
            //sleep(1000);
            //setToastshow(false);
        } catch (error) {
            console.log(error)
            return false;
        }
    }

    const action2 = async () => {
        try {
            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();

            var SUCoinContract = await new ethers.Contract(wrapperTokenAddress, wrapperTokenABI.abi, signer);

            const value = ethers.utils.parseUnits(amount, 18);

            setToastshow(true)
            setToastheader("Signing the Transaction")
            setToasttext("Please sign the transaction from your wallet.")

            var sellTx = await SUCoinContract.withdrawTo(await signer.getAddress(), value);

            setToastshow(false)
            setToastshow(true)
            setToastheader("Pending Transaction")
            setToasttext("Waiting for transaction confirmation.")

            await sellTx.wait(1);

            setToastshow(false)
            setToastshow(true)
            setToastheader("Success")
            setToasttext("Succesfuly swapped %s SUCoin to %s BiLira." + value);

            //sleep(1000);
            //setToastshow(false);
        } catch (error) {
            console.log(error)

            return false;
        }
    }

    const changeAsset = async () => {
        setTokens([tokens[1], tokens[0]])
        //asset == "SUCoin" ? setAsset("BiLira") : setAsset("SUCoin");
    }

    const handleInput = e => {
        const name = e.currentTarget.name;
        const value = e.currentTarget.value;

        if (name === 'amount') setAmount(value);
        if (name === 'amount2') setAmount(value);

        console.log("amm", amount)
    };

    return (
        <>
            <ToastBar toastText={toastText} toastHeader={toastHeader} toastShow={toastShow} setToastshow={setToastshow}></ToastBar>
            <Wrapper>

                <Container  >
                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label={tokens[0]}>
                                <Form.Control onChange={handleInput} name="amount" type="text" value={amount} />
                            </FloatingLabel>
                        </Col>
                    </Row >

                    <div style={{
                        justifyContent: "center", alignItems: "center", marginBottom: "30px", marginTop: "30px", marginLeft: "70px"
                    }}>
                        < Button variant="dark" onClick={() => changeAsset()}>

                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z" />
                            </svg>

                        </Button>
                    </div>

                    <Row className="g-2">
                        <Col md>
                            <FloatingLabel controlId="floatingInputGrid" label={tokens[1]}>
                                <Form.Control onChange={handleInput} name="amount2" type="text" value={amount} />
                            </FloatingLabel>
                        </Col>
                    </Row >

                    <br></br>
                    <Row style={{ justifyContent: "center", alignItems: "center" }}>
                        <Col style={{ justifyContent: "center", alignItems: "center", width: "60%" }}>
                            <Button style={{ justifyContent: "center", alignItems: "center", width: "100%" }} variant="dark" onClick={() => { swapTokens() }}> Swap</Button>
                        </Col>

                    </Row>
                </Container>
            </Wrapper >

        </>
    );
};



export default TokenSwap;