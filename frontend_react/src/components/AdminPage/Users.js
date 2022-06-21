import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Table from 'react-bootstrap/Table'
import { Container } from "@chakra-ui/react";



const Users = () => {

    const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
    
    const [users, setUsers] = useState([]);
    
    useEffect(async () => {
        try {
          apiInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${Cookies.get("token")}`;
    
          let response2 = new Promise((resolve, reject) => {
            apiInstance
              .get("/User/GetAll")
              .then((res) => {
                console.log("response: ", res.data);
                resolve(res);
              })
              .catch((e) => {
                const err = "Unable to get the users";
                reject(err);
              });
          });
          let result = await response2;
          console.log("Users get request is successful", result);
          setUsers(result.data.data);
          
        } catch (error) {
          console.log(error);
        }
      }, []);
      

    return(   
        <Container  marginTop={100} >  
        <Table responsive bordered = {true} bgcolor = "lightGray" hover= {true} >
  <thead>
    <tr>
      <th>#</th>
      <th>Name</th>
      <th>Surname</th>
      <th>Username</th>
      <th>Email</th>
      <th>Wallet Address</th>
      <th>Change Role</th>
      <th>Delete</th>
    
    </tr>
  </thead>
  <tbody>
  {users.map((index) => (
     <tr>
     <td key={index}>{index.id}</td>
     <td key={index}>{index.name}</td>
     <td key={index}>{index.surname}</td>
     <td key={index}>{index.username}</td>
     <td key={index}>{index.mailAddress}</td>
     <td key={index}>{index.address}</td>
     
        </tr>
        
      ))}

  </tbody>
</Table>
</Container>   
  );

}
export default Users;