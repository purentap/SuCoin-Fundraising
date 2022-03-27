import {VStack,Grid,GridItem} from "@chakra-ui/react"
import { useEffect } from "react";
import PrInfo from "./PrInfo";
import UsrInfo from "./UsrInfo";
import abi from '../abi/project.json'
import { ethers } from 'ethers';

import axios from 'axios'

import { hexToHash } from '../helpers'; 

import Cookies from 'js-cookie'
import { useState } from "react";

const apiInstance = axios.create({
  baseURL: "https://localhost:5001",
})

const getAllUserProjectHashes = async (provider,address) => {
  var Register = await new ethers.Contract(abi.address, abi.abi, provider);

  var filter = await Register.filters.Register(address)


  return (await Register.queryFilter(filter)).map(project => project.data);
}

const getAllProjects = async () => {

  apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`

  return await apiInstance.get("/Project/Get");

} 


const Profile = () => {

  const getAllUserProjectHashes = async (provider,address) => {
    var Register = await new ethers.Contract(abi.address, abi.abi, provider);
  
    var filter = await Register.filters.Register(address)
  
  
    return (await Register.queryFilter(filter)).map(project => project.data);
  }
  
  const getAllProjects = async () => {
  
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
  
    return await apiInstance.get("/Project/Get");
  
  } 

  const [projects,setProjects] =  useState([
    
  ])


  const isActiveUserProject = (project,wantedHashes,wantedAddress) => {

    const hash =  hexToHash(project?.fileHex)


    return ((project.proposerAddress == wantedAddress) && (wantedHashes.includes(hash)))



  }
  
  

  useEffect(async () => {
    //Needed for blockchain connections
    const provider = await new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    //Get all user projects in blockchain  (Will change later when delete comes)
    const hashes = await getAllUserProjectHashes(provider,address)


    //Get all projects from database and check if address and hashes match

    const allProjects = (await getAllProjects())?.data?.data
    const wantedProjects = allProjects.filter(project => isActiveUserProject(project,hashes,address))
  
    setProjects(wantedProjects)

  },[])

  return (
    
<Grid
height="90%"
width="90%"
  templateColumns='repeat(6, 1fr)'
  gap={200}
  m={20}
>
<GridItem colSpan={2}>
    <UsrInfo {...UsrInfo} ></UsrInfo>
</GridItem>

  <GridItem colSpan={4} >
    <VStack spacing={10}>
      {projects.map(project => <PrInfo {...project}/>)}
    </VStack>
  </GridItem>
</Grid>
  );
}

export default Profile;
