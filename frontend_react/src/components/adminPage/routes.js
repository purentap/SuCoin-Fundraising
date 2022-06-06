import React from "react";

import { Icon } from "@chakra-ui/react";
import {
  MdBarChart,
  MdDashboard,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
} from "react-icons/md";

// Admin Imports
// import MainDashboard from "views/admin/default";
// import NFTMarketplace from "views/admin/marketplace";
// import Profile from "views/admin/profile";
// import Kanban from "views/admin/kanban";
// import DataTables from "views/admin/dataTables";
// import RTL from "views/admin/rtl";

// Auth Imports
//import SignInCentered from "views/auth/signIn";

const routes = [
  {
    name: "Main Dashboard",
    layout: "/admin",
    path: "/default",
    icon: <Icon as={MdHome} width='20px' height='20px' color='inherit' />,
    //component: MainDashboard,
  },
  {
    name: "NFT Marketplace",
    layout: "/admin",
    path: "/nft-marketplace",
    icon: (
      <Icon
        as={MdOutlineShoppingCart}
        width='20px'
        height='20px'
        color='inherit'
      />
    ),
    //component: NFTMarketplace,
    secondary: true,
  },
  {
    name: "Data Tables",
    layout: "/admin",
    icon: <Icon as={MdBarChart} width='20px' height='20px' color='inherit' />,
    path: "/data-tables",
    //component: DataTables,
  },
  {
    name: "asdasd",
    layout: "/admin",
    icon: <Icon as={MdDashboard} width='20px' height='20px' color='inherit' />,
    path: "/kanban",
    //component: Kanban,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "/profile",
    icon: <Icon as={MdPerson} width='20px' height='20px' color='inherit' />,
    //component: Profile,
  },


];

export default routes;
