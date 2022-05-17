import { Wrapper } from "./ProjectCard.styles";
import dummyimg from  '../../images/dummyimg.png';
import ReactStars from "react-rating-stars-component";
import React from "react";
import { render } from "react-dom";
import axios from 'axios'
import Cookies from 'js-cookie'
import {getFileFromIpfs} from "../../helpers.js"




const ProjectCard = (props) => {


    const getFile = async () => {
      

      getFileFromIpfs(props.fileHex).then(res => downloadFile(res.data))
    
      const downloadFile = async (file) => {
        const reader = new FileReader()
      
    
        reader.readAsText(file);
        reader.onloadend = async () => {
          const data = window.URL.createObjectURL(file);
          const tempLink = await document.createElement('a');
          tempLink.href = data;
          tempLink.download = "Project_#" + props.projectID + ".pdf"; // some props receive from the component.
          tempLink.click();
        }
      }
    }
    
  return (
    <Wrapper>
        <div className="project-image">
            <img src={props.imageUrl == "emptyImg" ? dummyimg : props.imageUrl} alt=""/>
        </div>
        <h1>{props.projectName}</h1>
        <div>
            <h5>
                <p>{props.projectDescription}</p>
            </h5>
            <h5>
                Project Status: <p>{props.projectStatus}</p>{" "}
            </h5>
            <h5>
                Project Rating: 
                <div className="rating-stars">
                    <ReactStars
                        count={5}
                        value={props.projectRating}
                        edit={false}
                        size={35}
                        isHalf={true}
                        activeColor="#ffd700"
                    />
                </div>
            </h5>
        </div>
        <button onClick={getFile}>
            <a>
                Download Project PDF
            </a>
        </button>
        <button>
            <a href={'/projects/' + props.projectID}>
                More Project Details
            </a>
        </button>
    </Wrapper>
  );
};

export default ProjectCard;