import React, { useState, useContext, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ButtonToolbar from 'react-bootstrap/ButtonToolbar'
// Components
import Grid from './Grid';


import { useHomeFetch } from '../hooks/useHomeFetch';
import { Link } from 'react-router-dom';
import { red } from '@mui/material/colors';

import NoImage from '../images/no_image.jpg';
import { ProjectRow, ProjectRowDetails } from './ProjectRow';
import axios from 'axios'
import Accordion from 'react-bootstrap/Accordion'
import Cookies from 'js-cookie'

const radios = [
  { name: 'All', value: '0' },
  { name: 'Approved', value: '1' },
  { name: 'Pending', value: '2' },
  { name: 'Rejected', value: '3' },
];

const Projects = (props) => {
  console.log(props)
  return <section className="book">
    <h1> title </h1>

  </section>
}

var pj = [
  {
    id: 0,
    title: "Freelance Finder",
    faculty: "FENS",
    date: "date"
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
]

var pj2 = [
  {
    id: 0,
    title: "XXFreelance Finder",
    faculty: "FENS",
    date: "date"
  },
  {
    id: 1,
    title: "XXSuCoin",
    faculty: "FENS"
  },
  {
    id: 2,
    title: "XXVirtual Tour of Sabanci",
    faculty: "FENS"
  },
  {
    id: 3,
    title: "XXReal-time Marketing",
    faculty: "FMAN"
  },
]

const ProjectList = () => {
  const [error, setError] = useState(false);
  const [alignment, setAlignment] = useState(radios[0]);
  const [projects, setProjects] = useState(pj)
  const [response, setResponse] = useState([])

  const handleChange = async (newAlignment) => {
    if (newAlignment != null) {
      await setAlignment(newAlignment);
    }

  };


  const config = {
    headers: {
      "Content-type": "application/json",
    },
  };

  const getData = async () => {
    try {
      const response = await axios.get('https://localhost:5001/Project/Get', config);
      console.log("response")
      console.log(response.data.data)
      setProjects(response.data.data)
    } catch (error) {
      console.log(error)
      console.log("ERR END")
    }
    console.log("done")
  }

  useEffect(async () => {
    try {
      const apiInstance = axios.create({
        baseURL: "https://localhost:5001",
      })
      apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .get("/Project/Get")
          .then((res) => {
            console.log("response: ", res.data)
            resolve(res)
          })
          .catch((e) => {
            const err = "Unable to add the project"
            reject(err)

          })
      })
      let result = await response2
      console.log("ehee", result)
      setProjects(result.data.data)

    } catch (error) {
      console.log(error)
    }


  }, [alignment])



  return (
    <div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
        <ButtonGroup aria-label="Basic example"
          exclusive
        >
          <Button onClick={() => { handleChange(0) }} variant="outline-secondary" value={radios[0].value} >{radios[0].name} </Button>
          <Button onClick={() => { handleChange(1) }} variant="outline-secondary" value={radios[1].value} >{radios[1].name} </Button>
          <Button onClick={() => { handleChange(2) }} variant="outline-secondary" value={radios[2].value} >{radios[2].name} </Button>
          <Button onClick={() => { handleChange(3) }} variant="outline-secondary" value={radios[3].value} > {radios[3].name} </Button >
        </ButtonGroup >
      </div >

      <br></br>
      <div style={{ width: "90%", textAlign: "center", margin: "auto" }}>
        <Grid >
          {projects.map((project, index) => (
            <div>
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey={index}>
                  <Accordion.Header>Project #{project.projectID}    {project.projectName}     </Accordion.Header>
                  <Accordion.Body>
                    {project.projectDescription}
                    <br></br>

                    <Link to={'/projects/' + project.projectID} >
                      Project Page
                    </Link >
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </div>
          ))}

        </Grid>
      </div>
    </div>
  );
};

export default ProjectList;


