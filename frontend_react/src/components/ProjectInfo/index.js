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


import { Textarea, FormLabel, FormControl } from "@chakra-ui/react";

import ProjectRegister from '../../abi/project.json'
import Button from 'react-bootstrap/Button'

import ButtonGroup from '@mui/material/ButtonGroup';
import axios from 'axios'
import Cookies from 'js-cookie'

import { ethers } from 'ethers';
import ethersAbi from '../../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'
import Maestro from "../../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"

import abi from '../../abi/project.json'
import { useEffect } from 'react';

import { Divider, Grid } from "@material-ui/core/";
import { useNavigate } from 'react-router-dom';

import Auction from "../../contracts_hardhat/artifacts/contracts/UpgradeableAuctions/CappedTokenAuction.sol/CappedTokenAuction.json"


import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import { fixedNumberToNumber, numberToFixedNumber } from '../../helpers';

import ReactStars from "react-rating-stars-component";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from "@chakra-ui/react";

import { useDisclosure } from "@chakra-ui/react";

const maestro = { address: "0x90Cb7bD657d3a79a4E70E0458078dab56B9c9Fca" }

const ProjectInfo = ({ setProject,
  projectId,
  project,
  status,
  isOwner,
  isWhitelisted,
  fileHash,
  proposalDate,
  projectStatus,
  tokenCount,
  tokenName,
  tokenPrice,
  isAuctionCreated,
  onClickCreateToken,
  onClickCreateAuction,
  userEditFunction }) => {

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const editHandler = async (event) => {
    event.preventDefault();

    var editRequest = {
      username: "",
      name: "",
      surname: "",
      email: "",
      address: "",

    };

    console.log(editRequest);
    userEditFunction(editRequest);
  };



  const [approveVotes, setApprove] = useState()
  const [rejectVotes, setReject] = useState()
  const [hash, setHash] = useState()
  const [votesNeeded, setVotesneeded] = useState()
  const [isEditing, setEditing] = useState(false)


  const [projectName, setName] = useState('');
  const [projectDescription, setDescription] = useState('');
  const [projectImg, setImg] = useState('');

  const navigate = useNavigate();


  const startAuction = async (auctionContract) => {
    await auctionContract.startAuction(2000);
  }

  let startAuctionCallback = async () => {
    const provider = await new ethers.providers.Web3Provider(window.ethereum)

    const signer = await provider.getSigner()

    await startAuction(new ethers.Contract(project.auction, Auction.abi, signer))
  }


  useEffect(async () => {
    const CryptoJS = require('crypto-js');

    if (fileHash == hash)
      return


    setHash(fileHash)


    const provider = await new ethers.providers.Web3Provider(window.ethereum)


    const signer = await provider.getSigner()


    var registerContract = new ethers.Contract(abi.address, ethersAbi.abi, signer)
    var maestroContract = new ethers.Contract(maestro.address, Maestro.abi, signer)

    const projectInfo = await maestroContract.projectTokens(fileHash)

    const { tokenName } = (await maestroContract.getAllAuctionsByHashList([fileHash]))[0]

    project.tokenName = tokenName




    project.auction = projectInfo?.auction

    project.isAuctionCreated = project.auction != 0

    if (project.isAuctionCreated) {
      var cappedContract = new ethers.Contract(project.auction, Auction.abi, signer)
      try {
        const tokenSupply = await cappedContract.numberOfTokensToBeDistributed()
        project.tokenSupply = fixedNumberToNumber(tokenSupply)
        console.log(tokenSupply)
      }
      catch { }

    }





    project.auctionType = projectInfo?.auctionType

    setProject(project)




    var threshold = await registerContract.threshold()
    var wlCount = await registerContract.whitelistedCount()
    const votes = await registerContract.projectsRegistered(fileHash)


    setApprove(parseInt(await votes.approved))
    setReject(parseInt(await votes.rejected))
    setVotesneeded(Math.ceil(parseInt(wlCount) * parseInt(threshold) / 100))
    //changeProjectStatus()
  })






  const changeProjectStatus = async () => {
    const apiInstance = axios.create({
      baseURL: "https://localhost:5001",
    })
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
      apiInstance
        .put("/Project/ChangeStatus/" + projectId)
        .then((res) => {
          console.log(res.data)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
          console.log(e)
        })
    })
  }















  const approveProject = async () => {
    try {
      const CryptoJS = require('crypto-js');

      const provider = await new ethers.providers.Web3Provider(window.ethereum)
      const signer = await provider.getSigner()

      var registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)
      var registerTx = await registerContract.voteProposal(hash, true)
      var receipt = await registerTx.wait(1);
      const votes = await registerContract.projectsRegistered(hash)

      setApprove(parseInt(approveVotes) + 1)
      if (votes.finalized) {
        changeProjectStatus()
      }
    }
    catch (error) {

    }
  }

  const rejectProject = async () => {
    try {
      const CryptoJS = require('crypto-js');
      const provider = await new ethers.providers.Web3Provider(window.ethereum)
      const signer = await provider.getSigner()

      var registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)
      var registerTx = await registerContract.voteProposal(hash, false)
      var receipt = await registerTx.wait(1);

      setReject(rejectVotes + 1)

      const votes = await registerContract.projectsRegistered(hash)
      if (votes.finalized) {
        changeProjectStatus()
      }
    }
    catch (error) {

    }
  }

  const submitChanges = async () => {
    const apiInstance = axios.create({
      baseURL: "https://localhost:5001",
    })
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
      apiInstance
        .put("/Project/Update/",
          {
            projectID: projectId,
            projectName: projectName,
            projectDescription: projectDescription,
            imageUrl: projectImg,
            rating: project.rating,
            status: project.status,
            markDown: project.markDown,
            fileHash: project.fileHash
          })
        .then((res) => {
          console.log(res.data)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
          console.log(e)
        })

    })
    let result = await response2

    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    response2 = new Promise((resolve, reject) => {
      apiInstance
        .get("/Project/Get/" + projectId)
        .then((res) => {
          setProject(res.data.data)
          console.log("run bitch", res.data.data)
          console.log("PROJ UPDATED", res.data.data)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
        })
    })
    result = await response2
    setEditing(false)
  }

  const showEdit = async () => {
    setEditing(true)

  }

  const handleInput = e => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (name === 'name') setName(value);
    if (name === 'description') setDescription(value);
    if (name === 'imgUrl') setImg(value);

  };

  const ratingChanged = (newRating) => {
    console.log(newRating)
  }

  const whitelistesButtonGroup = (isWhiteListed) => {

    return (isWhiteListed ?
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <button className="accept-button" onClick={approveProject}>
          <a>
            Approve
          </a>
        </button>
        <button className="reject-button" onClick={rejectProject}>
          <a>
            Reject
          </a>
        </button>
      </div> : null
    )
  }




  const ownerButtonGroup = (isOwner, isAuctionCreated, project) => {
    return (isOwner ?
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <button className="button" onClick={onClickCreateToken}>
          <a>
            Create Tokens
          </a>
        </button>
        <button className="button" onClick={() => !project?.isAuctionCreated ? onClickCreateAuction() : startAuctionCallback()}>

          {project.isAuctionCreated ? "Start Auction" : "Create Auction"}

        </button>
      </div> : null
    )
  }


  return (
    <Wrapper>
      <Grid container spacing={0}>
        <Grid item xs style={{ justifyContent: 'space-between' }}>
          <h5>
            Proposal Date: <p>{proposalDate ? proposalDate.substring(0, proposalDate.indexOf("T")) : null}</p>{" "}
          </h5>
          <h5>
            Project Status: <p>{projectStatus}</p>{" "}
          </h5>
          <h5>
            Approval Ratio: <p>{(parseInt(approveVotes) / (parseInt(votesNeeded))) * 100}% approval from professors</p>{" "}
          </h5>
          <h5>
            Approved Votes Count: <p>{approveVotes} vote{approveVotes > 1 ? "s" : null} out of {parseInt(approveVotes) + parseInt(rejectVotes)} votes</p>{" "}
          </h5>
          <h5>
            Rejected Votes Count: <p>{rejectVotes} vote{approveVotes > 1 ? "s" : null} out of {parseInt(approveVotes) + parseInt(rejectVotes)} votes</p>{" "}
          </h5>
          {whitelistesButtonGroup(isWhitelisted)}

        </Grid>
        <Divider orientation="vertical" component="line" variant="middle" light={false} flexItem />
        <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
        <h5>
            Project Rating: <p>{<div className="rating-stars">
                    <ReactStars
                        count={5}
                        value={project?.rating}
                        edit={false}
                        size={35}
                        isHalf={true}
                        activeColor="#ffd700"
                    />
                </div>}</p>{" "}
          </h5>
          <h5>
            Tokens to be Distributed: <p>{project?.tokenSupply ?? "N/A"}</p>{" "}
          </h5>
          <h5>
            Token Name: <p>{project.tokenName == "" ? "N/A" : project.tokenName}</p>{" "}
          </h5>

          {ownerButtonGroup(isOwner, isAuctionCreated, project)}
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <Button
              onClick={onEditOpen}
              variant="ghost"
              textColor="white"
              background-color="#F8F8FF"
              color="#2f2d2e"
              border="2px solid #8e00b9"
              border-radius="30px"
              text-align="center"
              transition-duration="0.5s"
              animation="ease-in-out"
              _hover={{
                background: "linear-gradient(to left, #2d00f7, #ff0291)",
                transform: "scale(1.2)",
                border: "none",
                textColor: "white",
              }}
            >
              <a>Rate Project</a>
            </Button>
            <Modal
              isCentered
              onClose={onEditClose}
              isOpen={isEditOpen}
              motionPreset="slideInBottom"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Enter Your Rating</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={editHandler}>
                  <ModalBody>
                    <FormControl isRequired >
                      <div style={{margin:"auto", flex:"row"}}>
                        <ReactStars 
                          count={5}
                          value={0}
                          edit={true}
                          size={35}
                          isHalf={false}
                          activeColor="#ffd700"
                          onChange={ratingChanged}
                        />
                      </div>
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      onClick={onEditClose}
                      variant="ghost"
                      background-color="#F8F8FF"
                      color="#2f2d2e"
                      border="2px solid #8e00b9"
                      border-radius="30px"
                      text-align="center"
                      transition-duration="0.5s"
                      animation="ease-in-out"
                      _hover={{
                        background:
                          "linear-gradient(to left, #2d00f7, #ff0291)",
                        transform: "scale(1.2)",
                        border: "none",
                        textColor: "white",
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      variant="ghost"
                      background-color="#F8F8FF"
                      color="#2f2d2e"
                      border="2px solid #8e00b9"
                      border-radius="30px"
                      text-align="center"
                      transition-duration="0.5s"
                      animation="ease-in-out"
                      _hover={{
                        background:
                          "linear-gradient(to left, #2d00f7, #ff0291)",
                        transform: "scale(1.2)",
                        border: "none",
                        textColor: "white",
                      }}
                    >
                      Rate
                    </Button>
                  </ModalFooter>
                </form>
              </ModalContent>
            </Modal>
          </div>
        </Grid>
      </Grid>
    </Wrapper>
  );

}

ProjectInfo.propTypes = {
  project: PropTypes.object,
  status: PropTypes.string

}

export default ProjectInfo;