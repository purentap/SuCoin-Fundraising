import React from 'react';
import Sidebar from './components/AdminPage/Sidebar';
import { Outlet } from 'react-router';
import { Grid, GridItem } from '@chakra-ui/react';

export default () => {  return (
    <>
    <Grid>
        <GridItem colStart={0} colEnd={1} >
      <Sidebar />
      </GridItem>

      <GridItem  colStart={1} colEnd={6}>
      <Outlet />
      </GridItem>
    </Grid>
    </>
  );}