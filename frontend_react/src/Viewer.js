import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Table from 'react-bootstrap/Table'
import { Container, Button } from "@chakra-ui/react";

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
return(
<Container maxW={"13xl"}  marginTop={100} >  
        <Table responsive bordered = {true} bgcolor = "lightGray" hover= {true} >
  <thead>
    <tr>
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
     <td key={index}>{}</td>
     <td key={index}>{}</td>
     <td key={index}>{}</td>
     <td key={index}>{}</td>
     <td key={index}>{}</td>
     <td key={index}>{}</td>
     <td> </td>
     
        </tr>
        
      ))}

  </tbody>
</Table>
</Container> 
);
}
export default Viewer;