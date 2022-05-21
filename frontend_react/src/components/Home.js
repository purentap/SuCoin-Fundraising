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
import {getFileFromIpfs} from "../helpers.js"
// Hook
import { useHomeFetch } from '../hooks/useHomeFetch';
// Image
import NoImage from '../images/no_image.jpg';
import cool_jpeg from '../images/cool_block.jpeg';

import { getAuctionByStatus } from "./Auctions.js"

import { useNavigate } from 'react-router-dom';

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
    setAuctions(await getAuctionByStatus(1, 5))
    console.log("Random Auctions:", auctions)

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
      console.log("ehee", result)
      await setProjects(result.data.data)



    } catch (error) {
      console.log(error)
    }

    //setProjects(await )

    console.log(auctions[0])
    console.log("Random projects:", projects)
  }, [])



  const navigate = useNavigate();

  const increaseProjectIndex = () => {setProjectIndex((projectIndex +1) % 5)}
  const increaseAuctionIndex = () => {setAuctionIndex((auctionIndex +1) % auctions.length)}

  const decreaseProjectIndex = () => {setProjectIndex((projectIndex -1 + 5) % 5)}
  const decreaseAuctionIndex = () => {setAuctionIndex((auctionIndex -1) % auctions.length)}

  const navigateProjectDetail = (projectId) => {navigate('projects/' + projectId)}
  const navigateAuctionDetail = (projectId) => {navigate('auction/' + projectId, {state:auctions[auctionIndex]})}



  const courasel = (type) => {
    //todo get values according to request
    console.log("Random Auctions:", auctions)
    console.log("Random projects:", projects)
    console.log("Carousel Index", auctionIndex, projectIndex)


    console.log(projects[projectIndex],"asddassdsada")


    return (

      projects.length != 0 && auctions.length != 0 ?
      <>
        <div className="sectionName" style={{ textAlign: 'center' }}>{type}</div>
        <div className="courasel" id={type}>

          <div className='arrow' id="before">
            <img src={arrow} alt=""
              onClick={type == "Projects" ? decreaseProjectIndex : decreaseAuctionIndex}
            />
          </div>
          <div className="img-courasel"><img src={
            type == "Projects" ? (projects[projectIndex].imageURL ?? dummyimg) : (auctions[auctionIndex].imageURL ??  dummyimg)
            
          } style={{ borderRadius: '20px' }} alt="" /> </div>
          <div className="info">
            <div className="mini-info">
              <div className="name"> {type== "Projects" ? projects[projectIndex].projectName : auctions[auctionIndex].projectName} </div>
              <div className="button">
                <button onClick={() =>  type == "Projects" ? navigateProjectDetail(projects[projectIndex].projectID) : navigateAuctionDetail(auctions[auctionIndex].projectID)}>
                  {type == "Projects" ? "More Project Details" : "Go to Auction"}
                </button>
              </div>
            </div>
            <div className="detail"> {type== "Projects" ? projects[projectIndex].projectDescription : auctions[auctionIndex].projectDescription}</div>
          </div>
          <div className='arrow' id="next">
            <img style={{ transform: 'rotate(180deg)' }} src={arrow} alt="" onClick={type == "Projects" ? increaseProjectIndex : increaseAuctionIndex}
            />
          </div>
        </div></> : null
    )
  }

  if (error) return <div>Something went wrong ...</div>;

  return (
    <>
      <div className={'home-page'}>
        <div className="sectionName" style={{ paddingLeft: "50px", paddingTop: "25px", paddingBottom: "25px" }}>Welcome SULaunch</div>
        {courasel('Live Auctions')}
        {courasel('Projects')}
        <div className="sectionName" style={{ textAlign: 'center' }}>How To Use SULaunch</div>
        <img src={hwtouse} alt="" style={{ padding: '15px' }} />
        <div style={{ padding: '15px' }}>
          <div className="sectionName" style={{ paddingBottom: "15px" }} >About SuLaunch</div>
          <div >SULaunch is an ENS491/492 project offered at the SabancÄ± University as a graduation project. The main aim of this project is to introduce Blockchain technology to CS enthusiasts and ...
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;