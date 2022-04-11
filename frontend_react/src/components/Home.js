import React, { useState, useEffect } from 'react';

// API
import API from '../API'
// Components
import HeroImage from './HeroImage';
import Grid from './Grid';
import Thumb from './Thumb';
import Spinner from './Spinner';
import SearchBar from './SearchBar';
import Button from './Button';
import ProjectRegister from '../abi/project.json'
import Web3 from 'web3';


// Hook
import { useHomeFetch } from '../hooks/useHomeFetch';
// Image
import NoImage from '../images/no_image.jpg';
import cool_jpeg from '../images/cool_block.jpeg';

const Home = () => {
  const {
    state,
    loading,
    error,
    contract,
    //searchTerm,
    setSearchTerm,
    //setIsLoadingMore
  } = useHomeFetch();

  const handleRead = async () => {
    console.log("state")
    console.log(state)
    console.log(state.results)

  }

  if (error) return <div>Something went wrong ...</div>;

  return (
    <>
      <HeroImage
        image={cool_jpeg}
        title={"Help Raise Funds"}
        text={"Participate, fund and earn with student driven projects"}
      />

      <SearchBar setSearchTerm={setSearchTerm} />
      <Button text='ReadChain' callback={handleRead} />
      {/*TODO: hook kullanarak
      Movie yerine blockchainden projeler çekilecek

      <Grid header={searchTerm ? 'Search Result' : 'Projects'}>
        {state.results.map(project => (
          <Thumb
            key={""}
            clickable
            image={
              NoImage
            }
            movieId={"movie.id"}
          />
        ))}
        
      </Grid>
      */}
    </>
  );
};

export default Home;
