import React, { useState } from 'react';
import PropTypes from 'prop-types';
// Components
import Thumb from '../Thumb';
import Rate from '../Rate';
// Config
import { IMAGE_BASE_URL, POSTER_SIZE } from '../../config';
// Image
import NoImage from '../../images/no_image.jpg';
// Styles
import { Wrapper, Content, Text } from './ProjectInfo.styles';
import Web3 from 'web3';

import ProjectRegister from '../../abi/project.json'
import Button from 'react-bootstrap/Button'

import ButtonGroup from '@mui/material/ButtonGroup';
import axios from 'axios'
import Cookies from 'js-cookie'

import { ethers } from 'ethers';
import ethersAbi from '../../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'
import abi from '../../abi/project.json'
import { useEffect } from 'react';

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel';

import MaestroABI from '../../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json';
import CappedFCFS from '../../contracts_hardhat/artifacts/contracts/CappedFCFSAuction.sol/CappedFCFSAuction.json';
import CappedParcelLimitFCFS from '../../contracts_hardhat/artifacts/contracts/CappedParcelLimitFCFSAuction.sol/CappedParcelLimitFCFSAuction.json';
import CappedAuctionWRedistribution from '../../contracts_hardhat/artifacts/contracts/CappedAuctionWRedistribution.sol/CappedAuctionWRedistribution.json';
import DutchAuction from '../../contracts_hardhat/artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import TokenABI from '../../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';
import wrapperTokenABI from '../../contracts_hardhat/artifacts/contracts/WrapperToken.sol/WrapperToken.json';

const BiLiraAddress = "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3";

const maestro = { address: "0x4ED02B5dA043d8c9882f11B9784D67f2a7E9cC7C" }
const SUCoin = { address: "0xa011037b3EF5EFd8e98D619e4E2fB8CB0a6acE9E" }

const AuctionInfo = ({ auction, projectId, price, tokenDist, deposit }) => {

  const [tokens, setTokens] = useState(["SUCoin", "BiLira"])
  const [amount, setAmount] = useState();


  const [approveVotes, setApprove] = useState()
  const [rejectVotes, setReject] = useState()
  const [hash, setHash] = useState()
  const [votesNeeded, setVotesneeded] = useState()
  const [isEditing, setEditing] = useState(false)

  const [project, setProject] = useState();
  const [projectName, setName] = useState('');
  const [projectDescription, setDescription] = useState('');
  const [projectImg, setImg] = useState('');



  useEffect(async () => {
    //console.log("AUCG", auction)
    // setTokens(["SUCoin", auction.tokenSymbol])
  }, [])



  useEffect(async () => {
    const apiInstance = axios.create({
      baseURL: "https://localhost:5001",
    })
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
      apiInstance
        .get("/Project/Get/" + projectId)
        .then((res) => {
          setProject(res.data.data)
          //console.log("ripp", res.data.data)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
        })
    })
  }, [])

  const buyTokens = async () => {
    try {

      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();

      //const value = ethers.utils.parseUnits(amount, 18);
      const value = amount;


      var auctionSC = await new ethers.Contract(auction.auctionAddress, CappedFCFS.abi, signer);

      //var projectTokenSC = await new ethers.Contract(auction.wrapperTokenAddress, TokenABI.abi, signer);
      var SUCoinContract = await new ethers.Contract(SUCoin.address, wrapperTokenABI.abi, signer);

      //console.log("done", ethers.parseUnits(value, "gwei"))

      var approveTx = await SUCoinContract.approve(auction.auctionAddress, value);


      let receipt = await approveTx.wait(1);
      let bid1 = await auctionSC.bid(value);
      let bid1_receipt = await bid1.wait(1);

      console.log(bid1_receipt)

      //var buyTx = await SUCoinContract.depositFor(await signer.getAddress(), value);



      // receipt = await buyTx.wait(1);


    } catch (error) {
      console.log(error)
      return false;
    }
  }


  const handleInput = e => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (name === 'name') setName(value);
    if (name === 'description') setDescription(value);
    if (name === 'imgUrl') setImg(value);
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
                <div className='score'>{tokenDist}</div>
              </div>
              <div className='rating-directors'>
                <h3>Token Price</h3>
                <div className='score'>{price}</div>
              </div>

              <div className='rating-directors'>
                <h3>Tokens Left</h3>
                <div className='score'>{tokenDist - deposit}</div>
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
                    <Form.Control onChange={handleInput} name="amount2" type="text" value={(amount / price) | 0} />
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
