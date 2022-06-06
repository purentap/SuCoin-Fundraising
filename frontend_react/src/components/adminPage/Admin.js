import { SimpleGrid } from "@chakra-ui/react";
import { Card, Box } from "@material-ui/core";
import Dashboard from ".";
import CheckTable from "./components/CheckTable";

const AdminPage = () => {
    const columnsDataCheck = [
        {
          Header: "NAME",
          accessor: "name",
        },
        {
          Header: "PROGRESS",
          accessor: "progress",
        },
        {
          Header: "QUANTITY",
          accessor: "quantity",
        },
        {
          Header: "DATE",
          accessor: "date",
        },
      ];

      const tableDataCheck = [
        {
          "name":["Marketplace",false],
          "quantity": 2458, 
          "date": "12.Jan.2021",
          "progress": 75.5  
        },
        {
          "name":["Venus DB PRO",true],
          "quantity": 1485, 
          "date": "21.Feb.2021",
          "progress": 35.4  
        },
        {
          "name":["Venus DS",true],
          "quantity": 1024, 
          "date": "13.Mar.2021",
          "progress": 25  
        },
        {
          "name":["Venus 3D Asset",true],
          "quantity": 858, 
          "date": "24.Jan.2021",
          "progress": 100  
        },
        {
          "name":["Marketplace",false],
          "quantity": 258, 
          "date": "Oct 24, 2022",
          "progress": 75.5  
        },
        {
          "name":["Marketplace",false],
          "quantity": 258, 
          "date": "Oct 24, 2022",
          "progress": 75.5  
        },
        {
          "name":["Marketplace",false],
          "quantity": 258, 
          "date": "12.Jan.2021",
          "progress": 75.5  
        },
        {
          "name":["Venus DB PRO",false],
          "quantity": 858, 
          "date": "21.Feb.2021",
          "progress": 35.4  
        },
        {
          "name":["Venus DS",false],
          "quantity": 1024, 
          "date": "13.Mar.2021",
          "progress": 25  
        },
        {
          "name":["Venus 3D Asset",false],
          "quantity": 258, 
          "date": "24.Jan.2021",
          "progress": 100  
        },
        {
          "name":["Marketplace",false],
          "quantity": 1024, 
          "date": "Oct 24, 2022",
          "progress": 75.5  
        },
        {
          "name":["Marketplace",false],
          "quantity": 258, 
          "date": "Oct 24, 2022",
          "progress": 75.5  
        },
        {
          "name":["Marketplace",false],
          "quantity": 258, 
          "date": "Oct 24, 2022",
          "progress": 75.5  
        }
      ];

return(
<Box  pt={{ base: "130px", md: "80px", xl: "80px" }}>

<SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap='200px' mb='20px'>

<CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck}/>

</SimpleGrid>

</Box>
);

};

export default AdminPage;