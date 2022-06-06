import React from 'react';
import { Outlet } from 'react-router';
import Dashboard from './adminPage';


export default () => {
    return (
      <>
        <Dashboard/>
        <Outlet />
      </>
    );
  };
