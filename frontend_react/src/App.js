import './general.css'
import React, { Profiler, useContext, useState, useLocation } from 'react';
import { Switch } from '@chakra-ui/react';
// Routing
import { BrowserRouter, Routes, Route, HashRouter , withRouter,} from 'react-router-dom';
// Components
import Header from './components/Header';
import Home from './components/Home';
import Project from './components/Project';
import NotFound from './components/NotFound';
import ProjectList from './components/ProjectList';
import Apply from './components/Apply';
import Auctions from './components/Auctions';
import Auction from './components/Auction';
import CreateTokens from './components/CreateTokens';
import CreateAuction from './components/CreateAuction';
import TokenSwap from './components/TokenSwap';
import ProfilePage from './components/ProfilePage';
import Templates from "./templates"; // CAN BE DELETED

// Context
import { WalletSwitcher, UserContext } from './User';
// Styles
import { GlobalStyle } from './GlobalStyle';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminPage from './components/adminPage/Admin';
import WithoutNav from './components/withoutNav';
import WithNav from './components/withNav';


const App = (props) => {
  const Router = process.env.REACT_APP_IFS === "True" ? HashRouter : BrowserRouter
  const [address, setAddress] = useState("");
  const value = { address, setAddress };

  return (
    
    <Router>
      <div className="app">
        <UserContext.Provider value={value}>

          
            

           
            
            <Routes>
              <Route path = '/' element = {<WithNav/> }>
                <Route index element={<Home />} />
                <Route path='/projects' element={<ProjectList />} />
                <Route path='/apply' element={<Apply />} />
                <Route path='/createTokens' element={<CreateTokens />} />
                <Route path='/createAuction' element={<CreateAuction />} />
                <Route path='/auctions' element={<Auctions />} />
                <Route path='/tokenSwap' element={<TokenSwap />} />
                <Route path='/projects/:projectId' element={<Project />} />
                <Route path='/auction/:projectId' element={<Auction />} />
                <Route path = '/profile' element = {<ProfilePage />} />
                <Route path = '/tt' element = {<Templates />} />
                <Route path='/*' element={<NotFound />} />
              </Route>

              <Route path = '/admin' element = {<AdminPage/>} />
            </Routes>
           
          
          <GlobalStyle />
        </UserContext.Provider>
      </div>
      </Router>
    
  );
}

export default App;
