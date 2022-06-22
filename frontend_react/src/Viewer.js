import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Table from 'react-bootstrap/Table'
import { Container} from "@chakra-ui/react";
import { Button } from "react-bootstrap";
import { getFileFromIpfs } from "./helpers";
const Viewer = () => {
    const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
    
    
    const [projects, setProjects] = useState([]);
    const [projectID, setProjectID] = useState("");
    const [fileHash, setFileHash] = useState("");
    useEffect(async () => {
        try {
          apiInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${Cookies.get("token")}`;
    
          let response2 = new Promise((resolve, reject) => {
            apiInstance
              .get("/Project/ViewerPage/GetAll")
              .then((res) => {
                console.log("response: ", res.data);
                resolve(res);
              })
              .catch((e) => {
                const err = "Unable to get the projects";
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
      
      console.log(projects);

      
  const onDownloadPDF = async (projectID, fileHash) => {
    try {
      getFileFromIpfs(fileHash,"whitepaper").then(res => downloadFile(res.data,projectID))
    }
    catch (error) {
      console.log(error);
    }
  
  };

  const downloadFile = async (file, projectId) => {
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onloadend = async () => {
      const data = window.URL.createObjectURL(file);
      const tempLink = await document.createElement("a");
      tempLink.href = data;
      tempLink.download = "Project_#" + projectId + ".pdf"; // some props receive from the component.
      tempLink.click();
    };
  };

    const onAccept = async(projectID) => {

  
      try {
        apiInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${Cookies.get("token")}`;
        let response2 = new Promise((resolve, reject) => {
          apiInstance
            .put(`/Project/ViewerReply/${projectID}/${true}`)
            .then((res) => {
              console.log("Project is Accepted!")
              console.log("response: ", res.data);
 
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
    
    const onReject = async(projectID) => {

  
      try {
        apiInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${Cookies.get("token")}`;
        let response2 = new Promise((resolve, reject) => {
          apiInstance
            .put(`/Project/ViewerReply/${projectID}/${false}`)
            .then((res) => {
              console.log("Project is Rejected!")
              console.log("response: ", res.data);
              const newProjectList = projects.filter((project) => project.projectID !== projectID);
              
              setProjects(newProjectList);
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
    

return(
<Container maxW={"13xl"}  marginTop={100} >  
        <Table responsive bordered = {true} bgcolor = "lightGray" hover= {true} >
  <thead>
    <tr>
      <th>#</th>
      <th>#</th>
      <th>Project Name</th>
      <th>Description</th>
      <th>Status</th>
      <th>Rating</th>
      <th>Proposer Address</th>
      <th>File Hash</th>
      <th>Date</th>
    
    </tr>
  </thead>
  <tbody>
  {projects.map((index) => (
     <tr>
    
    <td key={index}><Button onClick={() => {onAccept(index.projectID)}}> Accept </Button><div style={{display: 'inline-block' , height:'auto' , width: 4}}> </div> <Button onClick={() => {onReject(index.projectID)}}> Reject </Button></td>
     <td key={index}><Button onClick={() => {onDownloadPDF(index.projectID, index.fileHash)}} > Download PDF </Button></td>
     <td key={index}>{index.projectName}</td>
     <td key={index}>{index.projectDescription}</td>
     <td key={index}>{index.status}</td>
     <td key={index}>{index.rating}</td>
     <td key={index}>{index.proposerAddress}</td>
     <td key={index}>{index.fileHash}</td>
     <td key={index}>{index.date}</td>
     
     
        </tr>
        
      ))}

  </tbody>
</Table>
</Container> 
);
}
export default Viewer;