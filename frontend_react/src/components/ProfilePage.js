import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import ProfilePageCard from "./ProfilePageUI/ProfilePageCard";
import ProjectsCard from "./ProfilePageUI/ProjectsCard";
import { Row } from "./ProfilePage.styles";
import { VStack, Grid, GridItem } from "@chakra-ui/react";
import abi from "../abi/project.json";
import { ethers } from "ethers";
import { hexToHash } from "../helpers";

var user = [];

const config = {
  headers: {
    "Content-type": "application/json",
  },
};

const apiInstance = axios.create({
  baseURL: "https://localhost:5001",
});

const getAllUserProjectHashes = async (provider, address) => {
  var Register = await new ethers.Contract(abi.address, abi.abi, provider);

  var filter = await Register.filters.Register(address);

  return (await Register.queryFilter(filter)).map((project) => project.data);
};

const getAllProjects = async () => {
  apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get(
    "token"
  )}`;

  return await apiInstance.get("/Project/Get");
};

const ProfilePage = () => {
  const [User, setUser] = useState(user);

  useEffect(async () => {
    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/User/Get")
          .then((res) => {
            console.log("response: ", res.data);
            resolve(res);
          })
          .catch((e) => {
            const err = "Unable to get the user";
            reject(err);
          });
      });
      let result = await response2;
      console.log("User get request is successful", result);
      setUser(result.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getAllUserProjectHashes = async (provider, address) => {
    var Register = await new ethers.Contract(abi.address, abi.abi, provider);

    var filter = await Register.filters.Register(address);

    return (await Register.queryFilter(filter)).map((project) => project.data);
  };

  const getAllProjects = async () => {
    apiInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${Cookies.get("token")}`;

    return await apiInstance.get("/Project/Get");
  };

  const [projects, setProjects] = useState([]);

  const isActiveUserProject = (project, wantedHashes, wantedAddress) => {
    const hash = hexToHash(project?.fileHex);

    return (
      project.proposerAddress == wantedAddress && wantedHashes.includes(hash)
    );
  };

  useEffect(async () => {
    //Needed for blockchain connections
    const provider = await new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    //Get all user projects in blockchain  (Will change later when delete comes)
    const hashes = await getAllUserProjectHashes(provider, address);

    //Get all projects from database and check if address and hashes match

    const allProjects = (await getAllProjects())?.data?.data;
    const wantedProjects = allProjects.filter((project) =>
      isActiveUserProject(project, hashes, address)
    );

    setProjects(wantedProjects);
  }, []);
  console.log(projects);
  return (
    <Grid
      height="90%"
      width="90%"
      templateColumns="repeat(6, 1fr)"
      gap={200}
      m={20}
    >
      <GridItem colSpan={2}>
        <ProfilePageCard
          name={User.name}
          surname={User.surname}
          address={User.address}
          email={User.email}
          username={User.username}
        />
      </GridItem>

      <GridItem colSpan={4}>
        {projects.map((project) => (
          <ProjectsCard
            projectName={project.projectName}
            status={project.status}
            projectDescription={project.projectDescription}
            imageUrl={project.imageUrl}
            rating = {project.rating}
            projectID = {project.projectID}
          ></ProjectsCard>
        ))}
      </GridItem>
    </Grid>
  );
};

export default ProfilePage;
