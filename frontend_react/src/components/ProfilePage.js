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
import ProjectInvitationCard from "./ProfilePageUI/ProjectInvitationCard";

import LoadingIcon from './LoadingIcon';

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

  const [isLoading, setIsLoading] = useState(true);

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
  const [invitedProjects, setInvitedProjects] = useState([]);

  useEffect(async () => {
    try {
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
      console.log("Projects get request is successful", result);
      setProjects(result.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(async () => {
    try {
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;

      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/Project/GetAllInvitations")
          .then((res) => {
            console.log("response: ", res.data);
            resolve(res);
          })
          .catch((e) => {
            const err = "Unable to get invitations of the user";
            reject(err);
          });
      });
      let result = await response2;
      console.log("Invitation get request is successful", result);
      setInvitedProjects(result.data.data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    }
  }, []);


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
            const newProjectList = projects.filter((project) => project.projectID !== deletedProject.projectID);
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

  const onInvitation = async (invitationRequest) => {
    try {
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .put("/User/Invite/", invitationRequest)
          .then((res) => {
            console.log("Invitation request sent")
            console.log("response: ", res.data)
          })
          .catch((e) => {
            const err = "Unable to send invitation request";
            reject(err);
          });
      });
      let result = await response2;
    } catch (error) {
      console.log(error);
    }
  };

  const onInvitationAccept = async (acceptedProject) => {
    const acceptRequest = {
      projectID: acceptedProject.projectID,
      Username: User.username,
      Role: "Editor",
      IsAccepted: true
    };

    try {
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .post("/User/InvitationReply", acceptRequest)
          .then((res) => {
            console.log("Project is Accepted!")
            console.log("response: ", res.data);
            const newProjectList = projects.concat(acceptedProject);
            const newInvitationList = invitedProjects.filter((project) => project.projectID !== acceptedProject.projectID);
            setProjects(newProjectList);
            setInvitedProjects(newInvitationList);
            resolve(res);



          })
          .catch((e) => {
            const err = "Unable to accept the project";
            reject(err);
          });
      });
      let result = await response2;
    } catch (error) {
      console.log(error);
    }
  };

  const onInvitationReject = async (rejectedProject) => {
    const rejectRequest = {
      projectID: rejectedProject.projectID,
      Username: User.username,
      Role: "Editor",
      IsAccepted: false
    };

    try {
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .post("/User/InvitationReply", rejectRequest)
          .then((res) => {
            console.log("Project is Rejected!")
            console.log("response: ", res.data);
            const newInvitationList = invitedProjects.filter((project) => project.projectID !== rejectedProject.projectID);
            setInvitedProjects(newInvitationList);
            resolve(res);



          })
          .catch((e) => {
            const err = "Unable to reject the project";
            reject(err);
          });
      });
      let result = await response2;
    } catch (error) {
      console.log(error);
    }
  };

  const onEdit = async (editRequest) => {
    editRequest.imageUrl = ""
    const apiInstance = axios.create({
      baseURL: "https://localhost:5001",
    })


    console.log(editRequest)
    apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
    let response2 = new Promise((resolve, reject) => {
      console.log(editRequest)
      apiInstance.put("/Project/Update/",
        {
          ProjectID: editRequest.projectID,
          ProjectName: editRequest.projectName,
          ProjectDescription: editRequest.projectDescription,

        })

        .then((res) => {
          console.log("Edit is done")
          console.log(res.data)
          resolve(res)
        })
        .catch((e) => {
          const err = "Unable to edite the project"
          reject(err)
          console.log(e)
        })

    })
  };

  return (
    isLoading ?

      <div style={{ width: '85%', margin: "auto" }}>
        <div className="sectionName" style={{ paddingLeft: "200px", paddingTop: "25px", paddingBottom: "25px" }}></div>
        <LoadingIcon />
      </div>
      :
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
            email={User.mailAddress}
            username={User.username}
          />
        </GridItem>

        <GridItem colSpan={4}>
          {invitedProjects.map((invitation) => (
            <ProjectInvitationCard
              projectName={invitation.projectName}
              status={invitation.status}
              projectDescription={invitation.projectDescription}
              imageUrl={invitation.imageUrl}
              rating={invitation.rating}
              projectID={invitation.projectID}
              invitationAccept={onInvitationAccept}
              invitationReject={onInvitationReject}>

            </ProjectInvitationCard>
          ))}


          {projects.map((project) => (
            <ProjectsCard
              projectName={project.projectName}
              status={project.status}
              projectDescription={project.projectDescription}
              rating={project.rating}
              projectID={project.projectID}
              fileHash={project.fileHash}
              deleteFunction={onDelete}
              invitationFunction={onInvitation}
              editFunction={onEdit}
            ></ProjectsCard>
          ))}


        </GridItem>
      </Grid>
  );
};

export default ProfilePage;
