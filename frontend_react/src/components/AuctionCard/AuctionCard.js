import { Wrapper } from "./AuctionCard.styles";
import dummyimg from  '../../images/dummyimg.png';
import { useNavigate } from 'react-router-dom';
import { getFileFromIpfs } from "../../helpers";
import { useEffect } from "react";
import { useState } from "react";

const AuctionCard = (props) => {

    const navigate = useNavigate();
    const [imageURL,setImageURL] = useState("")

    useEffect(async () =>  {
        const resultImage = await getFileFromIpfs(props.fileHex,"image")
        setImageURL(URL.createObjectURL(resultImage.data))
    },[props])

    console.log(props.fileHex)
    
  return (
    <Wrapper>
        <div className="project-image">
            <img src={imageURL ?? dummyimg} alt=""/>
        </div>
        <h1>{props.projectName}</h1>
        <div>
            <h5>
                <p>{props.projectDescription}</p>
            </h5>
            <h5>
                Auction Type: <p>{props.auctionType}</p>{" "}
            </h5>
            <h5>
                Token Name: <p>{props.tokenName}</p>{" "}
            </h5>
            <h5>
                Total Fund: <p>{props.totalFund} SUCoin/BiLira</p> 
            </h5>
        </div>
        <button onClick={() => navigate('/auction/' + props.projectID,{state:props.project})}>
            <a>
                Go To Auction
            </a>
        </button>
    </Wrapper>
  );
};

export default AuctionCard;