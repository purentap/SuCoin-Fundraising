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

import OBFCFSAuction from "../../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/OBFCFSAuction.sol/OBFCFSAuction.json"


import WrapperToken from "../../contracts_hardhat/artifacts/contracts/WrapperToken.sol/WrapperToken.json"

import { numberToFixedNumber } from '../../helpers';

import { Divider, Grid, TextField } from "@material-ui/core/";

const BiLiraAddress = "0x8f5736aF17F2F071B476Fd9cFD27a1Bd8D7E7F15";

const maestro = { address: "0x9B4900cf2c9417282a204440b2C6d4764963fbd8" }
const SUCoin = { address: "0x142E19B79A0101Dd5B382793D6D377Fd7df6365D" }

const AuctionInfo = ({ auction, status,projectId, price, tokenDist, deposit, totalRaise, limit, startingDate, duration, endingDate, remainingTime, auctionType, tokenName }) => {

  const [tokens, setTokens] = useState(["SUCoin", "BiLira"])
  const [amount, setAmount] = useState();
  const [userPrice, setUserPrice] = useState();

  var auctionMechanism = {
    "UncappedAuction": "Fixed price unlimited tokens only need the first parameter",
    "PseudoCappedAuction": "Fixed number of tokens but unlimited sucoins can be invested which will be distributed in the end burns all tokens if no one invests",
    "OBFCFSAuction": "FCFS Auction where users get their tokens at the end of auction",
    "FCFSAuction": "First come first serve, fixed price fixed supply token sale",
    "DutchAuction": "Fixed supply token auction with price going down to finalPrice linearly over the duration last parameter is ignored",
    "OBDutchAuction": "Investors can bid their price to tokens, at the end of the auction tokens will be distributed starting from the highest bid until all sold tokens are distributed, price parameters ignored",
    "StrictDutchAuction": "Dutch Auction but supply decreases linearly as well, burns the remaining coins instead of giving them to proposer"
  };



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

  const withdraw = async () => {
    try {

      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();


     var auctionSC = await new ethers.Contract(auction, OBFCFSAuction.abi, signer);

 
     await auctionSC.withDraw()



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
          {limit != null ? <h5>
            Limit: <p>{parseFloat(limit).toFixed(3)} Sucoins</p>{" "}
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
            {status == 1 ? 
            <>
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
            </>
            : null}
         
          </div>
          <br></br>

          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
              
            {status == 3 ?
            <>
            {limit != null ? <button className="button" onClick={() => withdraw()}>
              <a>
                Withdraw Tokens(only orderbook auctions)
              </a>
            </button> : null }
            </>
            :
            status ==  1 ?
            <>
            <button className="button" onClick={() => buyTokens(auctionType == "OBDutchAuction"  ? true : false)}>
              <a>
                Buy Token(s)
              </a>
            </button>

            {auctionType == "OBDutchAuction" ? <button className="button" onClick={() => buyTokens(false)}>
              <a>
                Buy Token(s) From Minimum Price
              </a>
            </button> : null}
            </> : null}
          
        
            
       
          </div>
        </Grid>
        <Divider orientation="vertical" component="line" variant="middle" light={false} flexItem />
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
          <h5>
            Auction Type: <p>{auctionType}</p>{" "}
          </h5>
          <h5>
            Auction Mechanism: <p>{auctionMechanism[auctionType]}</p>{" "}
          </h5>
          <h5>
            Starting Date: <p> {startingDate == 0 ? "Not started" : new Date(startingDate * 1000).toString()}</p>{" "}
          </h5>
          <h5>
            Ending Date: <p>{startingDate == 0 ? "Not started" : new Date(endingDate * 1000).toString()}</p>{" "}
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