import { useState, useEffect } from 'react';
// API
import API from '../API';
// Helpers
import { isPersistedState } from '../helpers';

const initialState = {
  page: 0,
  results: [],
  total_pages: 0,
  total_results: 0
};

export const useHomeFetch = () => {
  const [state, setState] = useState();
  const [loading, setloading] = useState(false);
  const [error, setError] = useState(false);
  const [contract, setContract] = useState();

  const fetchMovies = async (searchTerm = "", page = 0) => {

    try {
      //setError(true);
      setloading(true);

      const projects = await API.fetchProjects(searchTerm, page);
      console.log("PJ");
      console.log(projects);

      setState(prev => ({
        ...projects,
        results: 0 ? [...prev, ...projects] : [...projects]
      }))

    } catch (error) {
      //setError(true);
    }

  }


  useEffect(async () => {
    /*
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    console.log(account)
    var web3 = new Web3(Web3.givenProvider);
    console.log(await web3.eth.getChainId());

    var contract = await new web3.eth.Contract(ProjectRegister.abi, ProjectRegister.address);

    console.log("mapping : ")
    console.log(await contract.methods.registeredProjects(1).call())
    console.log("count : ")
    console.log(await contract.methods.getProjectCount().call())
 */
    fetchMovies("", 1);
  }, []);

  return { state, loading, error, contract}
/*
  // Search and initial
  useEffect(() => {
    if (!searchTerm) {
      const sessionState = isPersistedState('homeState');

      if (sessionState) {
        console.log('Grabbing from sessionStorage');
        setState(sessionState);
        return;
      }
    }
    console.log('Grabbing from API');
    setState(initialState);
    fetchMovies(1, searchTerm);
  }, [searchTerm]);

  // Load More
  useEffect(() => {
    if (!isLoadingMore) return;

    fetchMovies(state.page + 1, searchTerm);
    setIsLoadingMore(false);
  }, [isLoadingMore, searchTerm, state.page]);

  // Write to sessionStorage
  useEffect(() => {
    if (!searchTerm) sessionStorage.setItem('homeState', JSON.stringify(state));
  }, [searchTerm, state]);

 // return { state, loading, error, searchTerm, setSearchTerm, setIsLoadingMore };
*/

};
