import React, { useState } from 'react';
import PropTypes from 'prop-types';
// Components
// Config
// Image
// Styles
import { Wrapper, Content, Text } from './ProjectInfo.styles';

import Button from 'react-bootstrap/Button'



import { ethers } from 'ethers';


import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel';

import FCFSAuction from "../../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/FCFSAuction.sol/FCFSAuction.json"

import WrapperToken from "../../contracts_hardhat/artifacts/contracts/WrapperToken.sol/WrapperToken.json"

import {numberToFixedNumber  } from '../../helpers'; 

const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0x557596a0b4Ce6ec22BB6B533Aa49c6165eFD21cB" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const AuctionInfo = ({ auction, projectId, price, tokenDist, deposit }) => {

  const [tokens, setTokens] = useState(["SUCoin", "BiLira"])
  const [amount, setAmount] = useState();



  const buyTokens = async () => {
    try {

      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();

      
      const value = numberToFixedNumber(amount)


      var auctionSC = await new ethers.Contract(auction, FCFSAuction.abi, signer);

      var SUCoinContract = await new ethers.Contract(SUCoin.address, WrapperToken.abi, signer);


      var approveTx = await SUCoinContract.approve(auction, value);


      let receipt = await approveTx.wait(1);
      let bid1 = await auctionSC.bid(value);
      let bid1_receipt = await bid1.wait(1);

      console.log(bid1_receipt)




    } catch (error) {
      console.log(error)
      return false;
    }
  }


  const handleInput = e => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;


    if (name === 'amount') setAmount(value);
    if (name === 'amount2') setAmount(value);

  };

  

  return (
    <Wrapper backdrop={"#ccc"}>
      <Content>
        <Text>


          <div>
            <div>
              <h1>{"Auction"}</h1>
            </div>

            <div className='rating-directors'>
              <div className='rating-directors'>
                <h3>Total Supply</h3>
                <div className='score'>{Number(tokenDist).toFixed(2)}</div>
              </div>
              <div className='rating-directors'>
                <h3>Token Price</h3>
                <div className='score'>{Number(price).toFixed(5)}</div>
              </div>

              <div className='rating-directors'>
                <h3>Tokens Sold</h3>
                <div className='score'>{Number(deposit).toFixed(3)}</div>
              </div>
            </div>


            <Container style={{ width: "70%", paddingLeft: "35%" }}>
              <Row className="g-2">
                <Col md>
                  <FloatingLabel controlId="floatingInputGrid" label={tokens[0]}>
                    <Form.Control onChange={handleInput} name="amount" type="text" value={amount} />
                  </FloatingLabel>
                </Col>
              </Row >
              <Row className="g-2">
                <Col md>
                  <FloatingLabel controlId="floatingInputGrid" label={"Project Token"}>
                    <Form.Control onChange={handleInput} name="amount2" type="text" value={((amount / price) || 0)} />
                  </FloatingLabel>
                </Col>
              </Row >
              <Row >
                <Col style={{ justifyContent: "center", alignItems: "center" }}>
                  <Button variant="dark" onClick={() => buyTokens()}> Buy Tokens</Button>
                </Col>

                <Col style={{ justifyContent: "center", alignItems: "center" }}>

                </Col>

              </Row>
            </Container >

          </div>


        </Text>

      </Content>
    </Wrapper >
  );

}

AuctionInfo.propTypes = {
  project: PropTypes.object,
  status: PropTypes.string

}

export default AuctionInfo;
