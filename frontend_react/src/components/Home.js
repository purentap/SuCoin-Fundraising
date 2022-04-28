import React, { useState, useEffect } from 'react';
import arrow from  '../images/couraselarrow.svg';
import dummyimg from  '../images/dummyimg.png';
import hwtouse from  '../images/howtouse.svg';

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

// Hook
import { useHomeFetch } from '../hooks/useHomeFetch';
// Image
import NoImage from '../images/no_image.jpg';
import cool_jpeg from '../images/cool_block.jpeg';

import {getAuctionByStatus} from "./Auctions.js"

const Home = () => {
  const {
    state,
    loading,
    error,
    contract,
    //searchTerm,
    setSearchTerm,
    //setIsLoadingMore
  } = useHomeFetch();

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
    console.log(await getAuctionByStatus(0,5))

  })


  const courasel =  (type) => {
      //todo get values according to request


      return (
          <>
                <div className="sectionName" style={{textAlign:'center'}}>{type}</div>
              <div className="courasel" id={type}>

                  <div className='arrow' id="before"> <img src={arrow} alt=""/> </div>
                  <div className="img-courasel"><img src={dummyimg} alt=""/> </div>
                  <div className="info">
                      <div className="mini-info">
                          <div className="name"> Project Name </div>
                          <div className="btn-to-detail"> Click for More Detail </div>
                      </div>
                      <div className="detail"> xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
                  </div>
                  <div className='arrow' id="next" > <img style={{transform:'rotate(180deg)'}} src={arrow} alt=""/> </div>
              </div></>
     )
  }

  if (error) return <div>Something went wrong ...</div>;

  return (
    <>
        <div className={'home-page'}>
            <div className="sectionName" style={{paddingLeft:"50px", paddingTop:"25px", paddingBottom:"25px"}}>Welcome SULaunch</div>
            {courasel('Live Auctions')}
            {courasel('Projects')}
            <div className="sectionName" style={{textAlign:'center'}}>How To Use SULaunch</div>
            <img src={hwtouse} alt="" style={{padding: '15px'}}/>
            <div style={{padding:'15px'}}>
            <div className="sectionName" style={{paddingBottom:"15px"}} >About SuLaunch</div>
                <div >SULaunch is an ENS491/492 project offered at the Sabancı University as a graduation project. The main aim of this project is to introduce Blockchain technology to CS enthusiasts and ...
                </div>
            </div>
        </div>
    </>
  );
};

export default Home;
