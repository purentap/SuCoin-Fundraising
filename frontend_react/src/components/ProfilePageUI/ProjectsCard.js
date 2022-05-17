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
  FormControl,
  FormLabel,
  Textarea,
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
  Input,
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

import {getFileFromIpfs} from "../../helpers.js"
//id,imageUrl,desc,title,status,approvals

function ProjectsCard(props) {
  const colorMap = {
    Approved: "green",
    Rejected: "red",
    Pending: "orange",
  };

  const [username, setUserName] = useState("");
  const [role, setRole] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectImg, setProjectImg] = useState("");

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure(); //used for modals on button clicks
  const {
    isOpen: isInvitationOpen,
    onOpen: onInvitationOpen,
    onClose: onInvitationClose,
  } = useDisclosure();

  const deleteHandler = async () => {
    const deletedProject = props;

    props.deleteFunction(deletedProject);
  };

  const invitationHandler = async (event) => {
    event.preventDefault();

    var invitationRequest = {
      projectID: props.projectID,
      username: username,
      role: role,
    };
    props.invitationFunction(invitationRequest);
  };

  const editHandler = async (event) => {
    event.preventDefault();

    var editRequest = {
      projectID: props.projectID,
      projectName: projectName,
      projectDescription: projectDescription,
      imageUrl: projectImg,
      rating: props.rating,
      status: props.status,
    };

    props.editFunction(editRequest);
  };
  const handleInput = (e) => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (name == "username") setUserName(value);
    else if (name == "role") setRole(value);
    else if (name == "projectName") setProjectName(value);
    else if (name == "projectDescription") setProjectDescription(value);
    else if (name == "projectImg") setProjectImg(value);
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

  const onDownloadPDF = async () => {
    try {
      console.log(props)
      getFileFromIpfs(props.fileHex).then(res => downloadFile(res.data,props.projectID))
    }
    catch (error) {
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
            onClick={onEditOpen}
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
                        name="projectName"
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
                      <FormLabel>
                        Please enter the project image link:
                      </FormLabel>
                      <Input
                        name="projectImg"
                        onChange={handleInput}
                        placeholder="Project Image"
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
          </Button>
          <Button
            onClick={onDeleteOpen}
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
              onClose={onDeleteClose}
              isOpen={isDeleteOpen}
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
                    onClick={onDeleteClose}
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
            onClick={onInvitationOpen}
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
            <Modal
              isCentered
              onClose={onInvitationClose}
              isOpen={isInvitationOpen}
              motionPreset="slideInBottom"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>
                  Send invitation to your team member to collaborate!
                </ModalHeader>
                <ModalCloseButton />
                <form onSubmit={invitationHandler}>
                  <ModalBody>
                    <FormControl isRequired>
                      <FormLabel>
                        Please enter the username of the user:
                      </FormLabel>
                      <Input
                        name="username"
                        onChange={handleInput}
                        placeholder="Username"
                      />

                      <FormLabel>
                        Please enter the role of the user. Your team member can
                        be either Editor or Owner:{" "}
                      </FormLabel>
                      <Input
                        name="role"
                        onChange={handleInput}
                        placeholder="Role"
                      />
                    </FormControl>
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      onClick={onInvitationClose}
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
                      Send Invitation!
                    </Button>
                  </ModalFooter>
                </form>
              </ModalContent>
            </Modal>
          </Button>
        </HStack>
      </GridItem>
    </Grid>
  );
}

export default ProjectsCard;
