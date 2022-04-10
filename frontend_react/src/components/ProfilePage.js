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

  const [projects, setProjects] = useState([]);

  useEffect( async () => {
    try{
    apiInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${Cookies.get("token")}`;
    
    let response2 = new Promise((resolve, reject) => {
      apiInstance
        .get("/Project/GetAllPermissioned/false")
        .then((res) => {
          console.log("response: ", res.data);
          resolve(res);
        })
        .catch((e) => {
          const err = "Unable to get the projects of the user";
          reject(err);
        });
    });
    let result = await response2;
    console.log("User get request is successful", result);
    setProjects(result.data.data);
  } catch (error) {
    console.log(error);
  }
}, []);

  console.log(projects);

  const onDelete = async (deletedProject) => {
    try {
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .delete("/Project/Delete/" + deletedProject.projectID)
          .then((res) => {
            console.log("Project deleted!")
            console.log("response: ", res.data);
            const newProjectList = projects.filter((project) => project.id !== deletedProject.projectID);
            setProjects(newProjectList);
            resolve(res);

            
            
          })
          .catch((e) => {
            const err = "Unable to delete the project";
            reject(err);
          });
      });
      let result = await response2;
    } catch (error) {
      console.log(error);
    }
  };

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
            deleteFunction = {onDelete}
          ></ProjectsCard>
        ))}
      </GridItem>
    </Grid>
  );
};

export default ProfilePage;
