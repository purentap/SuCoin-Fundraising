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

const maestro = { address: "0x83193Cdb4Eb270C294E7547C23EA1f55A2f78d91" }
const SUCoin = { address: "0xb6e466F4F0ab1e2dA2E8237F38B2eCf6278894Ce" }

const AuctionInfo = ({ auction, projectId, price, tokenDist, deposit, totalRaise, startingDate, duration, endingDate, remainingTime, auctionType ,tokenName}) => {

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
    <Wrapper>
      <Grid container spacing={0}>
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
          <h5 style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            1 SUCoin = 1 BiLira
          </h5>
          <br></br>
          <h5>
            Total Raise: <p>{deposit} SUCoin</p>{" "}
          </h5>
          <h5>
            Total Supply: <p>{tokenDist} {tokenName}</p>{" "}
          </h5>
          <h5>
            Tokens Sold: <p>{deposit} {tokenName} </p>{" "}
          </h5>
          <div>
            <h5>
              Token Price:
            </h5>
            <p style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>{price} SUCoin</p>
          </div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-around" }}>
            <FloatingLabel controlId="floatingInputGrid" label={"Enter " + tokens[0]}>
              <Form.Control onChange={handleInput} name="amount" type="text" value={amount} />
            </FloatingLabel>
            <FloatingLabel controlId="floatingInputGrid" label={"Project Token"}>
              <Form.Control onChange={handleInput} name="amount2" type="text" value={((amount / price) || 0)} />
            </FloatingLabel>
          </div>
          <br></br>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <button className="button" onClick={() => buyTokens()}>
              <a>
                Buy Token(s)
              </a>
            </button>
          </div>
        </Grid>
        <Divider orientation="vertical" component="line" variant="middle" light={false} flexItem />
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
          <h5>
            Auction Type: <p>{auctionType}</p>{" "}
          </h5>
          <h5>
            Starting Date: <p>{new Date(startingDate * 1000).toString()}</p>{" "}
          </h5>
          <h5>
            Ending Date: <p>{new Date(endingDate * 1000).toString()}</p>{" "}
          </h5>
          <h5>
            Remaining Time: <p>{new Date((new Date(endingDate * 1000) - Date.now())).getSeconds()}</p>{" "}
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