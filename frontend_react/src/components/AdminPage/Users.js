import React, { useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Cookies from "js-cookie";
import Table from 'react-bootstrap/Table'
import projectRegisterAbi from "../../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json"

import { Container,
  Select ,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input, 
  useDisclosure,
  Button, 
  FormLabel, 
  FormControl,
  Checkbox,
Stack,
useCheckbox} from "@chakra-ui/react";
import {address} from '../../abi/project.json'


const Users = () => {
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();  


  const [role, setRole] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
 
  const editHandler = async (event) => {
    event.preventDefault();

    console.log(role);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const ProjectRegisterContract = new ethers.Contract(address, projectRegisterAbi, signer);

    ProjectRegisterContract.editUserStatus()
    var editRequest = {
      
    };

    console.log(editRequest);

  };


    const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
    
    const [users, setUsers] = useState([]);
    const [userAddress, setUserAddress] = useState([]);
    
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
      
      const handleInput = (e) => {
        const input_name = e.currentTarget.name;
        const value = e.currentTarget.value;
    
        setRole(value);
       
      };

    return(   
        <Container maxW={"13xl"} marginTop={100} >  
        <Table responsive bordered = {true} bgcolor = "lightGray" hover= {true} >
  <thead>
    <tr>
      <th>#</th>
      <th>Name</th>
      <th>Surname</th>
      <th>Username</th>
      <th>Email</th>
      <th>Wallet Address</th>

    
    </tr>
  </thead>
  <Modal
              isCentered
              onClose={onEditClose}
              isOpen={isEditOpen}
              motionPreset="slideInBottom"
            >
              <ModalOverlay />
              <ModalContent>
              <form onSubmit={editHandler}>
                <ModalHeader>Edit user information</ModalHeader>
                <ModalCloseButton />
                  <ModalBody>
                    <FormControl isRequired>
                      
                      <FormLabel>Change User Role:</FormLabel>
                      <Select id= 'userrole' placeholder='Select User Role' onChange={handleInput}>
                      <option  value='Whitelist'>Whitelisted</option>
                      <option value='Viewer'>Viewer</option>
                      <option value='Base'>Base</option>
                      </Select>
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      onClick={onEditClose}
                      color = 'white'
                      backgroundColor={'red'}
                    >
                      Delete User
                    </Button>
                    <Button
                      type="submit"
                      color = 'white'
                      backgroundColor={'green'}

                    >
                      Change Role
                    </Button>
                  </ModalFooter>
                  </form>
              </ModalContent>
            </Modal>
  <tbody>
  {users.map((index) => (
     <tr onClick={()=>{
      
      onEditOpen();
      setUserAddress(index.address);
      console.log("hello world my name is eren");
     }}>
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