import { SimpleGrid, Grid, GridItem } from "@chakra-ui/react";
import { Card, Box } from "@material-ui/core";
import Dashboard from ".";
import CheckTable from "./components/CheckTable";
import UserList from "./UserList";

const AdminPage = () => {


return(

<Grid
        height="90%"
        width="90%"
        templateRows={6}
        templateColumns="repeat(6, 1fr)"
        gap={200}
        m={20}
        paddingLeft={300}
      >
<GridItem colSpan={4}>
    <UserList></UserList>
</GridItem>


</Grid>
);

};

export default AdminPage;