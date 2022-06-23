import React, { useState, useEffect } from 'react';
import arrow from '../images/couraselarrow.svg';
import dummyimg from '../images/dummyimg.png';
import hwtouse from '../images/howtouse.svg';

// API
import API from '../API'
// Components
import HeroImage from './HeroImage';
import Grid from './Grid';
import Thumb from './Thumb';
import Spinner from './Spinner';
import SearchBar from './SearchBar';
import Button from './Button';
import ProjectRegister from '../abi/project.json'
import Web3 from 'web3';

import axios from 'axios'
import Cookies from 'js-cookie'
import Maestro from "../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json"
import { ethers } from 'ethers';
import { getFileFromIpfs } from "../helpers.js"
// Hook
import { useHomeFetch } from '../hooks/useHomeFetch';
// Image
import NoImage from '../images/no_image.jpg';
import cool_jpeg from '../images/cool_block.jpeg';

import { getAuctionByStatus } from "./Auctions.js"

import { useNavigate } from 'react-router-dom';

import LoadingIcon from './LoadingIcon';

const Home = () => {
  const {
    state,
    loading,
    error,
    liveAuction = [],
    contract,
    //searchTerm,
    setSearchTerm,
    //setIsLoadingMore
  } = useHomeFetch();

  const [auctions, setAuctions] = useState([]);
  const [projects, setProjects] = useState([]);

  const [auctionIndex, setAuctionIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);


  const handleRead = async () => {
    console.log("state")
    console.log(state)
    console.log(state.results)

  }


  //Gets x amount of random auctions
  //Status,Count
  //Status - 0 Off  1 - Running 2 - Finished
  //Count should be fixed later

  useEffect(async () => {


    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      })
      apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/Project/GetProjects/5")
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

      const tempAuctions = await getAuctionByStatus(1, 5)
      const getImagePromise = (selected) => getFileFromIpfs(selected.fileHash, "image").then(imageInfo => selected.imageURL = URL.createObjectURL(imageInfo.data))
      const tempProjects = result.data.data
      await Promise.all(tempProjects.concat(tempAuctions).map(getImagePromise))


      setProjects(tempProjects)
      setAuctions(tempAuctions)



    } catch (error) {
      console.log(error)
    }

    //setProjects(await )

    setIsLoading(false);

    console.log(auctions[0])
    console.log("Random projects:", projects)
  }, [])



  const navigate = useNavigate();

  const increaseProjectIndex = () => { setProjectIndex((projectIndex + 1) % projects.length) }
  const increaseAuctionIndex = () => { setAuctionIndex((auctionIndex + 1) % auctions.length) }

  const decreaseProjectIndex = () => { setProjectIndex((projectIndex - 1 + projects.length) % projects.length) }
  const decreaseAuctionIndex = () => { setAuctionIndex((auctionIndex - 1 + auctions.length) % auctions.length) }

  const navigateProjectDetail = (projectId) => { navigate('projects/' + projectId) }
  const navigateAuctionDetail = (projectId) => { navigate('auction/' + projectId, { state: auctions[auctionIndex] }) }





  const courasel = (type) => {



    if (type == "Projects") {
      var selectedList = projects
      var selectedIndex = projectIndex
      var indexIncrease = increaseProjectIndex
      var indexDecrease = decreaseProjectIndex
      var navigateTarget = navigateProjectDetail
      var buttonText = "More Project Details"
    }
    else {
      var selectedList = auctions
      var selectedIndex = auctionIndex
      var indexIncrease = increaseAuctionIndex
      var indexDecrease = decreaseAuctionIndex
      var navigateTarget = navigateAuctionDetail
      var buttonText = "Go To Auction"
    }

    if (selectedList.length > 0) {

      //Get pictures


      const selected = selectedList[selectedIndex]
      console.log(`Random ${type}: ${selectedList}`)

      console.log(selected.imageURL)

      return (

        <>
          <div className="sectionName" style={{ textAlign: 'center' }}>{type}</div>
          <div className="courasel" id={type}>

            <div className='arrow' id="before">
              <img src={arrow} alt=""
                onClick={indexDecrease}
              />
            </div>
            <div className="img-courasel"><img src={
              selected.imageURL ?? dummyimg

            } style={{ borderRadius: '20px', width: '350px', height: '250px' }} alt="" /> </div>
            <div className="info">
              <div className="mini-info">
                <div className="name"> {selected.projectName} </div>
                <div className="button">
                  <button onClick={() => navigateTarget(selected.projectID)}>
                    {buttonText}
                  </button>
                </div>
              </div>
              <div className="detail"> {selected.projectDescription}</div>
            </div>
            <div className='arrow' id="next">
              <img style={{ transform: 'rotate(180deg)' }} src={arrow} alt="" onClick={indexIncrease}
              />
            </div>
          </div></>
      )
    }
  }

  if (error) return <div>Something went wrong ...</div>;

  return (
    <>
      {isLoading ?
        <div className={'home-page'}>
          <div className="sectionName" style={{ paddingLeft: "50px", paddingTop: "25px", paddingBottom: "25px" }}>Welcome SULaunch</div>
          <LoadingIcon />
        </div>
        : <div className={'home-page'}>
          <div className="sectionName" style={{ paddingLeft: "50px", paddingTop: "25px", paddingBottom: "25px" }}>Welcome SULaunch</div>
          {courasel('Live Auctions')}
          {courasel('Projects')}
          <div className="sectionName" style={{ textAlign: 'center' }}>How To Use SULaunch</div>
          <img src={hwtouse} alt="" style={{ padding: '15px' }} />
          <div style={{ padding: '15px' }}>
            <div className="sectionName" style={{ paddingBottom: "15px" }} >About SuLaunch</div>
            <div >SULaunch is an ENS491/492 project offered at the Sabanci University as a graduation project. The main aim of this project is to introduce Blockchain technology to CS enthusiasts and wants to explore new technology.
            </div>
            <br></br>
            <div >This project aims to create the foundation for the utilization of blockchain technology in Sabanci University through a utility token (SuCoin) deployed on one of the EVM compatible blockchains. The main priority is to provide a fundraising platform for students to propose their projects and distribute their project’s tokens for funds via the auction mechanism provided by our system. The process will be as basic as possible for users to use blockchain technology, most of the key features of our project will be automated through the smart contracts and the backend server. One of the key points of this part of the project is to protect the ideas of the project proposers as in the real world, fundraising can be vulnerable to the theft of ideas. The project provides a hybrid solution where both traditional databases and a blockchain are utilized to provide a safety measure. This is achieved through saving the hash of the project details in the blockchain and commercialized versions of the project details in the database. This lets users be able to show the ownership of the document through their wallet and the logs in the blockchain by our web application during the applying process. The motivation for the project lies in the safety of the project’s owner’s rights, decentralization of the funding mechanisms around the schools, and providing a solid foundation for the later blockchain use cases which can be utilized through SUCoin.
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default Home;