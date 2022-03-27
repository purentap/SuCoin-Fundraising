import { Flex ,Text,Grid,GridItem,Center,Spacer,Image,HStack,Circle, VStack} from "@chakra-ui/react"
import { Box} from '@chakra-ui/react'



function UsrInfo({name,surname,mailAddress,status,username}) {

    console.log(name)
  

  return (
      <Center height="300px">
<Box height="100%"  bgColor="gray">
        <Flex height="100%" flexDir="column">
            <Center flex={1}>
            <Text whiteSpace="pre-wrap">
                {`Username:${username}\nName: ${name}\nSurname: ${surname}\nMail: ${mailAddress}`}
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
