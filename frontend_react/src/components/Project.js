import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../API';
import { useNavigate } from 'react-router-dom';
// Components
import BreadCrumb from './BreadCrumb';
import Grid from './Grid';
import Spinner from './Spinner';
import ProjectInfo from './ProjectInfo';
import ProjectInfoBar from './ProjectInfoBar';
import Actor from './ProjectMember';
import MDEditor from '@uiw/react-md-editor';
// Hook
import { useMovieFetch } from '../hooks/useMovieFetch';
// Image
import NoImage from '../images/no_image.jpg';
import ProjectRegister from '../abi/project.json'
import axios from 'axios'

import Web3 from 'web3';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import Cookies from 'js-cookie'

import { ethers } from 'ethers';
import ethersAbi from '../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'
import abi from '../abi/project.json'


const mkdStr = `# {Freelance Finder Version 2}
## Project Abstact
Abstract part
## Project Details
details part
### Details Part 1
details part 1
### Details Part 2
details part 2

## [Details on how to write with markdown](https://www.markdownguide.org/basic-syntax/)

`;

const Project = () => {
  const { projectId } = useParams();
  const [state, setState] = useState({ status: "default" })
  const [markdown, setMarkdown] = useState(mkdStr);
  const [isEditingChild, setEditingchild] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [isWhitelisted, setIswhitelisted] = useState(false);
  const [isOwner, setIsowner] = useState(false);
  const [owner, setOwner] = useState();
  const [signer, setSigner] = useState()

  const [project, setProject] = useState({
    rating: 0,
    imageUrl: "",
    markdown: "",
    projectDescription: "",
    projectName: "",
    status: "",
  });

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
          setMarkdown(res.data.data.markDown)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to add the project"
          reject(err)
        })
    })
  }, [])


  useEffect(async () => {
    const CryptoJS = require('crypto-js');

    const provider = await new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner()
    const registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)

    const hash = "0x" + await CryptoJS.SHA256(project.fileHex).toString()
    const projInfo = await registerContract.projectsRegistered(hash)

    if (await registerContract.whitelist(await signer.getAddress())) {
      setIswhitelisted(true)
      console.log("whitelisted bitch")
    } else {
      setIswhitelisted(false)
      console.log("NOT whitelisted bitch")
    }
    setOwner(await projInfo.proposer)
    setSigner(await signer.getAddress())

  }, [project])


  useEffect(async () => {
    if (owner == signer) {
      setIsowner(true)
    } else {
      setIsowner(false)
    }
  }, [owner, signer])

  const config = {
    headers: {
      "Content-type": "application/json",
    },
  };
  const handleEdit = async () => {
    setEditing(true);
  }

  const handleEditSubmission = async () => {
    setEditing(false);

    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      })
      apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .put("/Project/UpdateMarkDown/" + projectId + "/" + markdown
          )
          .then((res) => {
            console.log("response: ", res.data)
            resolve(res)
          })
          .catch((e) => {
            const err = "Unable to add the project"
            reject(err)

          })
      })
      let result = await response2
    } catch (error) {
      console.log(error)

    }
  }
  const navigate = useNavigate();

  return (
    <div>
      <BreadCrumb projectTitle={project.projectName} />
      <ProjectInfo setProject={setProject} projectId={projectId} project={project} status={state.status} isOwner={isOwner} isWhitelisted={isWhitelisted} />
      {
        isOwner ?

          <Container style={{ width: "70%", paddingLeft: "35%" }}>
            <Row >
              <Col style={{ justifyContent: "center", alignItems: "center" }}>
                <Button variant="dark" onClick={() => navigate("/createTokens")}> Create Tokens</Button>
              </Col>

              <Col style={{ justifyContent: "center", alignItems: "center" }}>
                <Button variant="dark" onClick={() => navigate("/createAuction",
                  {
                    hash: "hey"
                  })}> Create Auction</Button>
              </Col>

            </Row>
          </Container > :
          <></>}

      <br></br>
      <br></br>
      <ProjectInfoBar
        time={"movie.id"}
        budget={"movie.id"}
        revenue={"movie.id"}
      />
      <br></br>
      {isOwner ?
        <div className="container">
          <Button style={{ margin: "10px" }} onClick={() => { handleEdit() }}> Edit Project Page</Button>
          {isEditing ?
            <div style={{ width: "100%", textAlign: "center", margin: "auto" }}>
              <MDEditor width={window.innerWidth} height={500} value={markdown} onChange={setMarkdown} />
              <div style={{ padding: "50px 0 0 0" }} />
              <Button onClick={() => { handleEditSubmission() }}> Save Changes</Button>
            </div>
            :
            <MDEditor.Markdown
              source={markdown}
              linkTarget="_blank"
            />
          }
        </div>
        :
        <MDEditor.Markdown style={{ margin: "5%" }}
          source={markdown}
          linkTarget="_blank"
        />
      }
    </div>
  );
};

export default Project;
