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

import { numberToFixedNumber } from '../../helpers';

import { Divider, Grid, TextField } from "@material-ui/core/";

const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0xFD5C6cEb69cc683F051d4eA5a11eb2FE6DA02A06" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const AuctionInfo = ({ auction, projectId, price, tokenDist, deposit, totalRaise, startingDate, duration, endingDate, remainingTime, auctionType, tokenName }) => {

  const [tokens, setTokens] = useState(["SUCoin", "BiLira"])
  const [amount, setAmount] = useState();
  const [userPrice, setUserPrice] = useState();



  const buyTokens = async (priceEntered) => {
    try {

      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();


      const value = numberToFixedNumber(amount)


      var auctionSC = await new ethers.Contract(auction, FCFSAuction.abi, signer);

      var SUCoinContract = await new ethers.Contract(SUCoin.address, WrapperToken.abi, signer);


      var approveTx = await SUCoinContract.approve(auction, value);


      let receipt = await approveTx.wait(1);
      let bid1 = priceEntered ? await auctionSC.bid(value, userPrice) : await auctionSC.bid(value);
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
    if (name === 'userPrice') setUserPrice(value);
  };



  return (
    <Wrapper>
      <Grid container spacing={0}>
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
          <h5 style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            1 SUCoin = 1 BiLira
          </h5>
          <br></br>
          <h5>
            Total Raise: <p>{parseFloat(totalRaise).toFixed(3)} SUCoin</p>{" "}
          </h5>
          {auctionType != "UncappedAuction" ? <h5>
            Total Supply: <p>{parseFloat(tokenDist).toFixed(3)} {tokenName}</p>{" "}
          </h5> : null}
          {auctionType != "PseudoCappedAuction" ? <h5>
            Tokens Sold: <p>{parseFloat(deposit).toFixed(3)} {tokenName} </p>{" "}
          </h5> : null}
          <div>
            <h5>
              {auctionType == "OBDutchAuction" ? "Minimum" : null} Token Price:
            </h5>
            <p style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>{parseFloat(price).toFixed(4)} SUCoin</p>
          </div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
            <FloatingLabel controlId="floatingInputGrid" label={"Enter " + tokens[0]}>
              <Form.Control onChange={handleInput} name="amount" type="text" value={amount} />
            </FloatingLabel>
            {auctionType == "OBDutchAuction" ?
              <FloatingLabel controlId="floatingInputGrid" label={"Enter Token Price"}>
                <Form.Control onChange={handleInput} name="userPrice" type="text" value={userPrice} />
              </FloatingLabel> :
              <FloatingLabel controlId="floatingInputGrid" label={"Project Token"}>
                <Form.Control onChange={handleInput} name="amount2" type="text" value={((amount / price) || 0)} />
              </FloatingLabel>}
          </div>
          <br></br>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <button className="button" onClick={() => buyTokens(auctionType == "OBDutchAuction" ? true : false)}>
              <a>
                Buy Token(s)
              </a>
            </button>
            {auctionType == "OBDutchAuction" ? <button className="button" onClick={() => buyTokens(false)}>
              <a>
                Buy Token(s) From Minimum Price
              </a>
            </button> : null}
          </div>
        </Grid>
        <Divider orientation="vertical" component="line" variant="middle" light={false} flexItem />
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
          <h5>
            Auction Type: <p>{auctionType}</p>{" "}
          </h5>
          <h5>
            Auction Mechanism: <p>Price will drop by the time goes. Try to be enter SUCoin amount according to your token price/supply strategy.</p>{" "}
          </h5>
          <h5>
            Starting Date: <p>{new Date(startingDate * 1000).toString()}</p>{" "}
          </h5>
          <h5>
            Ending Date: <p>{new Date(endingDate * 1000).toString()}</p>{" "}
          </h5>
        </Grid>
      </Grid>
    </Wrapper>
  );

}

AuctionInfo.propTypes = {
  project: PropTypes.object,
  status: PropTypes.string

}

export default AuctionInfo;