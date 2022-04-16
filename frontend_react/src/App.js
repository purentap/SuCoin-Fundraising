import './general.css'
import React, { Profiler, useContext, useState } from 'react';
// Routing
import { BrowserRouter, Routes, Route, HashRouter } from 'react-router-dom';
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

// Context
import { WalletSwitcher, UserContext } from './User';
// Styles
import { GlobalStyle } from './GlobalStyle';
import 'bootstrap/dist/css/bootstrap.min.css';


const App = () => {
  const Router = process.env.REACT_APP_IFS === "True" ? HashRouter : BrowserRouter
  const [address, setAddress] = useState("");
  const value = { address, setAddress };

  return (
    <Router>
      <div className="app">
        <UserContext.Provider value={value}>
          <Header >

          </Header>

          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/projects' element={<ProjectList />} />
            <Route path='/apply' element={<Apply />} />
            <Route path='/createTokens' element={<CreateTokens />} />
            <Route path='/createAuction' element={<CreateAuction />} />
            <Route path='/auctions' element={<Auctions />} />
            <Route path='/tokenSwap' element={<TokenSwap />} />
            <Route path='/projects/:projectId' element={<Project />} />
            <Route path='/auction/:projectId' element={<Auction />} />
            <Route path = '/profile' element = {<ProfilePage />} />
            <Route path='/*' element={<NotFound />} />
          </Routes>
          <GlobalStyle />
        </UserContext.Provider>
      </div>
    </Router>
  );
}

export default App;
