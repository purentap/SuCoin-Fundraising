import { useState, useEffect } from 'react';
import API from '../API';
// Helpers
import { isPersistedState } from '../helpers';

const list = [
  {
    id: 0,
    title: "Freelance Finder",
    faculty: "FENS"   
  },
  {
    id: 1,
    title: "SuCoin",
    faculty: "FENS"
  },
  {
    id: 2,
    title: "Virtual Tour of Sabanci",
    faculty: "FENS"
  },
  {
    id: 3,
    title: "Real-time Marketing",
    faculty: "FMAN"
  },
];

export const useMovieFetch = movieId => {

  
  const [state, setState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
 
 
  return { 
    id: 0,
    title: "Freelance Finder",
    faculty: "FENS"  
  };
 
  /*
 

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(false);

        const movie = await API.fetchMovie(movieId);
        const credits = await API.fetchCredits(movieId);
        // Get directors only
        const directors = credits.crew.filter(
          member => member.job === 'Director'
        );

        setState({
          ...movie,
          actors: credits.cast,
          directors
        });

        setLoading(false);
      } catch (error) {
        setError(true);
      }
    };

    const sessionState = isPersistedState(movieId);

    if (sessionState) {
      setState(sessionState);
      setLoading(false);
      return;
    }

    fetchMovie();
  }, [movieId]);

  // Write to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(movieId, JSON.stringify(state));
  }, [movieId, state]);

  return { state, loading, error };
  */
};
