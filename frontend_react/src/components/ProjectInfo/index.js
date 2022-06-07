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
import Maestro from "../../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"

import abi from '../../abi/project.json'
import { useEffect } from 'react';

import { Divider, Grid } from "@material-ui/core/";
import { useNavigate } from 'react-router-dom';

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'

const maestro = { address: "0x0699c46bf17AE35FAcBFC50D75cD37Ead6Ebe15b" }

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
  onClickCreateAuction }) => {

  const [approveVotes, setApprove] = useState()
  const [rejectVotes, setReject] = useState()
  const [hash, setHash] = useState()
  const [votesNeeded, setVotesneeded] = useState()
  const [isEditing, setEditing] = useState(false)

  
  const [projectName, setName] = useState('');
  const [projectDescription, setDescription] = useState('');
  const [projectImg, setImg] = useState('');

  const navigate = useNavigate();



    
  useEffect(async () => {
    const CryptoJS = require('crypto-js');

    if (fileHash == hash)
      return


    setHash(fileHash)

    const provider = await new ethers.providers.Web3Provider(window.ethereum)


    const signer = await provider.getSigner()


    var registerContract = new ethers.Contract(abi.address, ethersAbi.abi, signer)
    var maestroContract = new ethers.Contract(maestro.address, Maestro.abi, provider)

    const projectInfo = await maestroContract.projectTokens(fileHash)

    project.auction = projectInfo?.auction

    project.isAuctionCreated = project.auction != 0

    project.auctionType = projectInfo?.auctionType

    setProject(project)

    


    var threshold = await registerContract.threshold()
    var wlCount = await registerContract.whitelistedCount()
    const votes = await registerContract.projectsRegistered(fileHash)

    setApprove(await votes.approved.toString())
    setReject(await votes.rejected.toString())
    setVotesneeded(Math.ceil(wlCount.toString() * threshold.toString() / 100))
    //changeProjectStatus()
  })



  const addWhitelist = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    console.log(account)
    var web3 = new Web3(Web3.givenProvider);
    console.log(await web3.eth.getChainId());

    var carContractAddress = ProjectRegister.address;
    var carAbi = ProjectRegister.abi;
    var carContract = await new web3.eth.Contract(carAbi, carContractAddress);
  }



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
      
      setApprove(approveVotes + 1)
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



const ownerButtonGroup = (isOwner, isAuctionCreated , project) => {
    return (isOwner ?
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
            <button className="button" onClick={onClickCreateToken}>
                <a>
                    Create Tokens
                </a>
            </button>
            <button className="button" onClick={() => !project?.isAuctionCreated ? onClickCreateAuction() : navigate('/auction/' + projectId, {state:project})}>
                
                    {isAuctionCreated ? "Start Auction" : "Create Auction"}
                
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
                        Approval Ratio: <p>{(parseInt(approveVotes) / (parseInt(approveVotes) + parseInt(rejectVotes)))* 100}% approval from professors</p>{" "}
                    </h5>
                    <h5>
                        Approved Votes Count: <p>{approveVotes} vote{approveVotes>1 ? "s" : null} out of {parseInt(approveVotes) + parseInt(rejectVotes)} votes</p>{" "}
                    </h5>
                    <h5>
                        Rejected Votes Count: <p>{rejectVotes} vote{approveVotes>1 ? "s" : null} out of {parseInt(approveVotes) + parseInt(rejectVotes)} votes</p>{" "}
                    </h5>
                    {whitelistesButtonGroup(isWhitelisted)}
                </Grid>
                <Divider orientation="vertical" component="line" variant="middle" light={false} flexItem />
                <Grid item xs style={{ display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: 'space-between' }}>
                    <h5>
                        Tokens to be Distributed: <p>{tokenCount}</p>{" "}
                    </h5>
                    <h5>
                        Token Name: <p>{tokenName}</p>{" "}
                    </h5>
                    <h5>
                        Latest Token Price: <p>{tokenPrice}</p>{" "}
                    </h5>
                    {ownerButtonGroup(isOwner, isAuctionCreated,project)}
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