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

const ProjectInfo = ({ project, status, isWhitelisted, isOwner, projectId, setProject }) => {

  const [approveVotes, setApprove] = useState()
  const [rejectVotes, setReject] = useState()
  const [hash, setHash] = useState()
  const [votesNeeded, setVotesneeded] = useState()
  const [isEditing, setEditing] = useState(false)

  const [projectName, setName] = useState('');
  const [projectDescription, setDescription] = useState('');
  const [projectImg, setImg] = useState('');



  useEffect(async () => {
    const CryptoJS = require('crypto-js');

    const hash = "0x" + await CryptoJS.SHA256(project.fileHex).toString()

    setHash(hash)

    const provider = await new ethers.providers.Web3Provider(window.ethereum)

    const signer = await provider.getSigner()

    var registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)
    var threshold = await registerContract.threshold()
    var wlCount = await registerContract.whitelistedCount()
    const votes = await registerContract.projectsRegistered(hash)

    setApprove(await votes.approved.toString())
    setReject(await votes.rejected.toString())
    console.log("YOOO", votes.finalized, votes.decision)
    console.log("YOOO", votes.approved.toString(), votes.rejected.toString())
    console.log("YOOO", Math.ceil(wlCount.toString() * threshold.toString() / 100))
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

  const getFile = async () => {
    const apiInstance = axios.create({
      baseURL: "https://localhost:5001",
    })
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
      apiInstance
        .get("/Project/Get/" + projectId)
        .then((res) => {
          downloadFile(res.data.data.fileHex)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
          console.log(e)
        })
    })
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



  const downloadFile = async (file) => {
    const reader = new FileReader()
    const x = Buffer.from(file, 'hex')
    const blob = new Blob([x.buffer]);

    reader.readAsText(blob);
    reader.onloadend = async () => {
      const data = window.URL.createObjectURL(blob);
      const tempLink = await document.createElement('a');
      tempLink.href = data;
      tempLink.download = "Project_#" + projectId + ".pdf"; // some props receive from the component.
      tempLink.click();
    }
  }

  const approveProject = async () => {
    try {


      const CryptoJS = require('crypto-js');
      const hash = "0x" + await CryptoJS.SHA256(project.fileHex).toString()

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
      const hash = "0x" + await CryptoJS.SHA256(project.fileHex).toString()
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
            fileHex: project.fileHex
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

  return (
    <Wrapper backdrop={"#ccc"}>
      <Content>
        <Thumb style={{ alignItems: "center" }}
          image={
            project.imageUrl == "" ? NoImage : project.imageUrl

          }
          clickable={false}
          alt='movie-thumb'
        />

        <Text>
          {
            isEditing ?

              <div>


                <Form>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Enter Project Name</Form.Label>
                    <Form.Control name="name" onChange={handleInput} type="email" placeholder={project.projectName} />
                  </Form.Group>
                </Form>


                <Form>
                  <Form.Group className="mb-3" controlId="floatingTextarea2">
                    <Form.Label>Enter Project Description</Form.Label>
                    <Form.Control onChange={handleInput} type="email" placeholder={project.projectDescription}
                      name="description"
                      as="textarea"
                      placeholder="Enter Project Desription Here"
                      style={{ height: '150px' }} />
                  </Form.Group>
                </Form>

                <Form>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Enter Project Image URL</Form.Label>
                    <Form.Control onChange={handleInput} name="imgUrl" type="email" placeholder={project.imageUrl} />
                  </Form.Group>
                </Form>
                <Button variant="dark" onClick={() => submitChanges()}>Submit Changes</Button>
              </div>
              :
              <div>
                <div>
                  <h1>{project.projectName}</h1>
                  <h3>About the Project</h3>

                  <p>{project.projectDescription}</p>
                </div>


                <Button variant="dark" onClick={() => getFile()}>Download PDF</Button>

                <div className='rating-directors'>
                  <div className='rating-directors'>
                    <h3>Approve Votes</h3>
                    <div className='score'>{approveVotes}/{votesNeeded}</div>
                  </div>

                  <div className='rating-directors'>
                    <h3>Reject Votes</h3>
                    <div className='score'>{rejectVotes}/{votesNeeded}</div>
                  </div>
                </div>

                {isWhitelisted ?
                  <div >
                    <h3>    Vote </h3>
                    <Button variant="success" onClick={() => approveProject()}>Approve</Button>

                    <Button variant="danger" onClick={() => rejectProject()}>Reject</Button>

                  </div>
                  : <div></div>
                }
                <div style={{ padding: "60px 0px", marginLeft: "" }}>
                  {status == "authority" ?
                    <form onSubmit={addWhitelist}>
                      <label>
                        Whitelist to Add:
                        <input type="text" name="name" />
                      </label>
                      <input type="submit" value="Submit" />
                    </form>
                    : <div></div>
                  }
                  {isOwner ?
                    <div >
                      <Button variant="dark" onClick={() => showEdit()}>Edit Project</Button>
                    </div>
                    : <div></div>
                  }

                </div>


              </div>

          }

        </Text>

      </Content>
    </Wrapper>
  );

}

ProjectInfo.propTypes = {
  project: PropTypes.object,
  status: PropTypes.string

}

export default ProjectInfo;
