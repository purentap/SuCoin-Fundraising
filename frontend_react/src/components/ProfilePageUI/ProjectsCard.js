import {
  Flex,
  Text,
  Grid,
  GridItem,
  Center,
  Spacer,
  Image,
  HStack,
  Circle,
  Heading,
  useDisclosure,
  Box,
  Stack,
} from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

import { useState } from "react";
import NoImage from "../../images/no_image.jpg";
import axios from "axios";
import Cookies from "js-cookie";
//id,imageUrl,desc,title,status,approvals

function ProjectsCard(props) {
  const colorMap = {
    Approved: "green",
    Rejected: "red",
    Pending: "orange",
  };

  const { isOpen, onOpen, onClose } = useDisclosure(); //used for modals on button clicks

  const deleteHandler = async () => {
    const deletedProject = props;

    props.deleteFunction(deletedProject);
  };

  const onDownloadPDF = async () => {
    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      });
      apiInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${Cookies.get("token")}`;
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/Project/GetPDF/" + props.projectID)
          .then((res) => {
            console.log("Succesfully got project pdf");
            return res;
          })
          .catch((e) => {
            const err = "Unable to get the project PDF";
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
      border="1px"
      borderRadius="20px"
      marginTop={30}
      h="50%"
      w="100%"
      templateRows="repeat(5, 1fr)"
      templateColumns="repeat(6, 1fr)"
      gap={10}
      mr={10}
      ml={10}
      m={0}
    >
      <GridItem rowSpan={1} colSpan={5}>
        <Grid
          borderRadius="20px"
          h="100%"
          w="100%"
          templateRows="repeat(1, 1fr)"
          templateColumns="repeat(5, 1fr)"
          gap={10}
        >
          <GridItem mt="30px" rowSpan={1} colSpan={3}>
            <Center>
              <Heading size="md">{props.projectName}</Heading>
            </Center>
          </GridItem>

          <GridItem mt="20px" rowSpan={1} colSpan={1}>
            <Center>
              <Text>#Rating: {props.rating}</Text>
            </Center>
          </GridItem>

          <GridItem mt="20px" rowSpan={1} colSpan={1}>
            <Flex>
              <Text>Status : {props.status}</Text>

              <Circle
                height="25px"
                mr={15}
                minWidth="25px"
                bgColor={colorMap[props.status] ?? "red"}
              ></Circle>
            </Flex>
          </GridItem>
        </Grid>
      </GridItem>
      <GridItem
        ml="20px"
        borderRadius="20px"
        rowSpan={2}
        colSpan={2}
        bgColor="gray"
      >
        <Image
          borderRadius="20px"
          src={
            props.imageUrl == "" || props.imageUrl == "emptyImg"
              ? NoImage
              : props.imageUrl
          }
          boxSize="100%"
          objectFit="fill"
        />
      </GridItem>

      <GridItem
        borderRadius="20px"
        rowSpan={2}
        colSpan={4}
        border="1px"
        marginRight={50}
      >
        <Center height="100%">
          <Text>{props.projectDescription}</Text>
        </Center>
      </GridItem>

      <GridItem
        ml="20px"
        mr="20px"
        rowStart={4}
        rowEnd={5}
        colStart={1}
        colEnd={7}
      >
        <HStack spacing={10} height="100%">
          <Button
            onClick={onDownloadPDF}
            variant="ghost"
            textColor="white"
            height="80%"
            width="40%"
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
            <Text>Download PDF</Text>
          </Button>
          <Button
            variant="ghost"
            textColor="white"
            height="80%"
            width="40%"
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
            <Text>Edit Project</Text>
          </Button>
          <Button
            onClick={onOpen}
            variant="ghost"
            textColor="white"
            height="80%"
            width="40%"
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
            <Text>Delete Project</Text>
            <Modal
              isCentered
              onClose={onClose}
              isOpen={isOpen}
              motionPreset="slideInBottom"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>
                  Are you sure you want to delete this project?
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text count={2}>You cannot undo this process.</Text>
                </ModalBody>
                <ModalFooter>
                  <Button
                    onClick={onClose}
                    variant="ghost"
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
                    Close
                  </Button>
                  <Button
                    onClick={deleteHandler}
                    variant="ghost"
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
                    Delete Project
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Button>

          <Button
            variant="ghost"
            textColor="white"
            height="80%"
            width="40%"
            background-color="#F8F8FF"
            color="#2f2d2e"
            border="2px solid #8e00b9"
            border-radius="30px"
            text-align="center"
            transition-duration="0.5s"
            animation="ease-in-out"
            _hover={{
              background: "linear-gradient(to left, #2d00f7, #ff0291)",
              transform: "scale(1.1)",
              border: "none",
              textColor: "white",
            }}
          >
            <Text>Add Collaborator</Text>
          </Button>
        </HStack>
      </GridItem>
    </Grid>
  );
}

export default ProjectsCard;
