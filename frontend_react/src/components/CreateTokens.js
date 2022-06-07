import React, { useState} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


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


import { ethers, FixedNumber } from 'ethers';
import { numberToFixedNumber } from '../helpers';
import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"


const maestro = { address: "0x8D75b1988bD233350F61d594b261197DDd7C6425" }


const CreateTokens = () => {

    const hash = useLocation()?.state?.hash
    console.log(hash)

    const [tokenName, setTokenName] = useState();
    const [tokenSymbol, setTokenSymbol] = useState();
    const [totalSupply, setTotalSupply] = useState();

    const [toastShow, setToastshow] = useState(false);
    const [toastText, setToasttext] = useState();
    const [toastHeader, setToastheader] = useState();



    const action1 = async () => {
        try {
            const decimals = 18                                                          
            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            const signer = await provider.getSigner();
     
            const totalSupplyDecimals = numberToFixedNumber(totalSupply,decimals)

            let MAESTRO = new ethers.Contract(maestro.address, Maestro.abi, signer);

            console.log(MAESTRO)

            setToastshow(true)
            setToastheader("Signing the Transaction")
            setToasttext("Please sign the transaction from your wallet.")
            const tokenProxy = await MAESTRO.createToken(hash,tokenName,tokenSymbol,totalSupplyDecimals)


            setToastshow(false)
            setToastshow(true)
            setToastheader("Pending Transaction")
            setToasttext("Waiting for transaction confirmation.")
            console.log("Your token deploye on address: %s", tokenProxy.address);
            setToastshow(false);
        } catch (error) {
            console.log(error)
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