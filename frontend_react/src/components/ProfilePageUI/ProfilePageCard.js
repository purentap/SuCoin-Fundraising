import { Wrapper } from "./ProfilePageCard.styles";
import { Button, Text,Textarea, FormLabel, FormControl } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from "@chakra-ui/react";
import { useState } from "react";
import { useEffect } from "react";
import { useDisclosure } from "@chakra-ui/react";


const ProfilePageCard = (props) => {
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  const editHandler = async (event) => {
    event.preventDefault();

    var editRequest = {
      
    };

    //props.userEditFunction(editRequest);
  };

  const handleInput = (e) => {
    const input_name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (input_name == "name") setName(value);
    else if (input_name == "surname") setSurname(value);
    else if (input_name == "email") setEmail(value);
  };

  return (
    <Wrapper>
      <h1>Welcome {props.name}</h1>
      <div>
        <h5>
          Username: <p>{props.username}</p>
        </h5>
        <h5>
          Name: <p>{props.name}</p>{" "}
        </h5>
        <h5>
          Surname: <p>{props.surname}</p>{" "}
        </h5>
        <h5>
          Email: <p>{props.email}</p>
        </h5>
        <h5>
          Wallet Address: <p>{props.address}</p>
        </h5>
      </div>
      <Button
            onClick={onEditOpen}
            variant="ghost"
            textColor="white"
            background-color="#F8F8FF"
            color="#2f2d2e"
            border="2px solid #8e00b9"
            border-radius="30px"
            text-align="center"
            transition-duration="0.5s"
            animation="ease-in-out"
            _hover={{
              background: "linear-gradient(to left, #2d00f7, #ff0291)",
              transform: "scale(1.2)",
              border: "none",
              textColor: "white",
            }}
          >
            <Text>Edit User Information</Text>
            </Button>
            <Modal
              isCentered
              onClose={onEditClose}
              isOpen={isEditOpen}
              motionPreset="slideInBottom"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit your project name & description</ModalHeader>
                <ModalCloseButton />
                <form onSubmit={editHandler}>
                  <ModalBody>
                    <FormControl isRequired>
                      <FormLabel>Please enter the project name:</FormLabel>
                      <Input
                        name="name"
                        onChange={handleInput}
                        placeholder="Project Name"
                      />
                      <FormLabel>
                        Please enter the project description:
                      </FormLabel>
                      <Textarea
                        name="projectDescription"
                        onChange={handleInput}
                        placeholder="Project Description"
                      />
                    
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      onClick={onEditClose}
                      variant="ghost"
                      background-color="#F8F8FF"
                      color="#2f2d2e"
                      border="2px solid #8e00b9"
                      border-radius="30px"
                      text-align="center"
                      transition-duration="0.5s"
                      animation="ease-in-out"
                      _hover={{
                        background:
                          "linear-gradient(to left, #2d00f7, #ff0291)",
                        transform: "scale(1.2)",
                        border: "none",
                        textColor: "white",
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      type="submit"
                      variant="ghost"
                      background-color="#F8F8FF"
                      color="#2f2d2e"
                      border="2px solid #8e00b9"
                      border-radius="30px"
                      text-align="center"
                      transition-duration="0.5s"
                      animation="ease-in-out"
                      _hover={{
                        background:
                          "linear-gradient(to left, #2d00f7, #ff0291)",
                        transform: "scale(1.2)",
                        border: "none",
                        textColor: "white",
                      }}
                    >
                      Edit
                    </Button>
                  </ModalFooter>
                </form>
              </ModalContent>
            </Modal>
    </Wrapper>
  );
};

export default ProfilePageCard;
