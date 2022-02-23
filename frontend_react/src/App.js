import React, { useContext, useState } from 'react';
// Routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// Context
import { WalletSwitcher, UserContext } from './User';
// Styles
import { GlobalStyle } from './GlobalStyle';
import 'bootstrap/dist/css/bootstrap.min.css';


const App = () => {
  const [address, setAddress] = useState("");
  const value = { address, setAddress };

  return (
    <Router>
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
          <Route path='/*' element={<NotFound />} />
        </Routes>
        <GlobalStyle />
      </UserContext.Provider>
    </Router>
  );
}

export default App;
