import { Flex ,Text,Grid,GridItem,Center,Spacer,Image,HStack,Circle, VStack} from "@chakra-ui/react"
import { Box} from '@chakra-ui/react'



function UsrInfo({name,surname,mail,status}) {

    console.log(name)
  

  return (
      <Center height="35%">
<Box height="100%"  bgColor="gray">
        <Flex height="100%" flexDir="column">
            <Center flex={1}>
            <Text whiteSpace="pre-wrap">
                {`Name: ${name}\nSurname: ${surname}\nMail: ${mail}`}
            </Text>
            </Center>
            <Spacer/>
            <Text >
                Status: {status}
            </Text>
        </Flex>
        
    </Box>
      </Center>
    



  );
}

export default UsrInfo;
