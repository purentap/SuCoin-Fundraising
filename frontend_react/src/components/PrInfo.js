import { Flex ,Text,Grid,GridItem,Center,Spacer,Image,HStack,Circle} from "@chakra-ui/react"
import { Button} from '@chakra-ui/react'

//id,imageUrl,desc,title,status,approvals

function PrInfo({projectID,rating,status,projectName,projectDescription,imageUrl}) {
    const colorMap = {
        "Approved":"green",
        "Rejected":"red",
        "Pending":"orange"
    }

  return (
<Grid border="1px"
  h="100%"
  w="100%"
  templateRows='repeat(5, 1fr)'
  templateColumns='repeat(5, 1fr)'
  gap={10}
  mr={10}
  ml={10}
  m={0}
>

  <GridItem rowSpan={1} colSpan={5}>
  <Grid
    h="100%"
    w="100%"
  templateRows='repeat(1, 1fr)'
  templateColumns='repeat(5, 1fr)'
  gap={10}
 >
     <GridItem rowSpan={1} colSpan={3}>
     <Center>
       <Text>
         {projectName}
       </Text>
       </Center>
     </GridItem>

     <GridItem rowSpan={1} colSpan={1} border="1px">
       <Center>
       <Text >
         #Rating: {rating}
       </Text>
       </Center>
     
     </GridItem>

     <GridItem rowSpan={1} colSpan={1}>
      
      <Flex>
      <Spacer/>

      <Text  >
          Status : {status}
       </Text>
       <Spacer/>
      
      <Circle height="25px" mr={15} minWidth="25px" bgColor={colorMap[status] ?? "red"}>
        
      </Circle>
      
      </Flex>


     </GridItem>


 </Grid>
  </GridItem>




  <GridItem rowSpan={4} colSpan={1} bgColor="gray">
  <Image src={imageUrl} boxSize="100%" objectFit="fill" />

  </GridItem>



  
  <GridItem  rowSpan={3} colSpan={4}  border="1px" marginRight={50}>
    <Center height="100%">
    <Text  >
         {projectDescription}
    </Text>
    
    </Center>
  </GridItem>

  <GridItem rowSpan={1} colSpan={4} marginRight={50}>
    <HStack spacing={10} height="100%">
    <Button height="100%" flex="1"><Text >Download PDF</Text></Button>
    <Button height="100%" flex="1"><Text>Edit Project</Text></Button>
    <Button height="100%" flex="1"><Text>Delete Project</Text></Button>
    <Button height="100%" flex="1"><Text >Add Collaborator</Text></Button>
    </HStack>
  </GridItem>

  



</Grid>

  );
}

export default PrInfo;
