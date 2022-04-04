import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../API';
import { useNavigate } from 'react-router-dom';
// Components
import BreadCrumb from './BreadCrumb';
import Grid from './Grid';
import Spinner from './Spinner';
import AuctionInfo from './AuctionInfo';
import ProjectInfoBar from './ProjectInfoBar';
import Actor from './ProjectMember';
import MDEditor from '@uiw/react-md-editor';
// Hook
import { useMovieFetch } from '../hooks/useMovieFetch';
// Image
import NoImage from '../images/no_image.jpg';
import ProjectRegister from '../abi/project.json'
import axios from 'axios'

import Web3 from 'web3';
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import Cookies from 'js-cookie'

import { ethers, FixedNumber } from 'ethers';
import ethersAbi from '../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'
import abi from '../abi/project.json'

import MaestroABI from '../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json';


import DutchAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/DutchAuction.sol/DutchAuction.json';

import FCFSAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/FCFSAuction.sol/FCFSAuction.json';

import FCFSLimitAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/FCFSLimitAuction.sol/FCFSLimitAuction.json';


import UncappedAuction from '../contracts_hardhat/artifacts/contracts/DeployableAuctions/UncappedAuction.sol/UncappedAuction.json';

import { fixedNumberToNumber } from '../helpers'; 

import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';
import { WalletSwitcher } from '../User';
const MaestroAddress = "0xD25Bf7F0C712859F6e5ea48aB5c82174f81Bd233";

const mkdStr = `# {Freelance Finder Version 2}
## Project Abstact
Abstract part
## Project Details
details part
### Details Part 1
details part 1
### Details Part 2
details part 2

## [Details on how to write with markdown](https://www.markdownguide.org/basic-syntax/)

`;

const Auction = () => {

    const { projectId } = useParams({});

    const [markdown, setMarkdown] = useState(mkdStr);
    const [isEditingChild, setEditingchild] = useState(false);
    const [isEditing, setEditing] = useState(false);
    const [isWhitelisted, setIswhitelisted] = useState(false);
    const [isOwner, setIsowner] = useState(false);
    const [owner, setOwner] = useState();
    const [signer, setSigner] = useState()
    const [projects, setProjects] = useState();

    const [auction, setAuction] = useState();

    const [price, setPrice] = useState();
    const [tokenDist, setTokenDist] = useState();
    const [soldToken, setSoldTokens] = useState();



    const [auctionType, setAuctiontype] = useState();

    const [auctions, setAuctions] = useState([
      
    ]);

    const [project, setProject] = useState({
        rating: 0,
        imageUrl: "",
        markdown: "",
        projectDescription: "",
        projectName: "",
        status: "",
    });

    useEffect(async () => {
        try {
            const CryptoJS = require('crypto-js');
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
            console.log("ehee", result.data.data)
            setProjects(result.data.data)


            

            const provider = await new ethers.providers.Web3Provider(window.ethereum);
            var Maestro = await new ethers.Contract(MaestroAddress, MaestroABI.abi, provider);

            var filter = await Maestro.filters.CreateAuctionEvent();

            var allCreateAuctionEvents = await Maestro.queryFilter(filter);
            var allAuctions = [];
            for (let index = 0; index < allCreateAuctionEvents.length; index++) {
                let aucAddress = allCreateAuctionEvents[index].args.auction;
                let fileHash = allCreateAuctionEvents[index].args.fileHash;
                let auctionType = allCreateAuctionEvents[index].args.auctionType;
                let creator = allCreateAuctionEvents[index].args.creator;
                let Project = await Maestro.projectTokens(fileHash);
                let tokenSC = await new ethers.Contract(Project.token, TokenABI.abi, provider);
                let tokenSymbol = await tokenSC.symbol();
                let tokenName = await tokenSC.name();
                let auctionSc = await new ethers.Contract(aucAddress, (auctionType == 'FCFSAuction' ? FCFSAuction.abi : (auctionType == 'FCFSLimitAuction' ? FCFSLimitAuction.abi : ((auctionType == "DutchAuction" ? DutchAuction.abi : DutchAuction.abi)))), provider);
            
                const status = ["notStarted","Ongoing","Finished"][await auctionSc.status()]


                var id
                result.data.data.forEach(proj => {
                    //console.log("XX", auct.fileHash, " VS ", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                    if (fileHash == "0x" + CryptoJS.SHA256(proj.fileHex).toString()) {
                        //console.log("match", "0x" + CryptoJS.SHA256(proj.fileHex).toString())
                        //console.log(proj.projectID)
                        id = proj.projectID

                    }
                })


                allAuctions.push({ "id": id, "auctionAddress": aucAddress, "fileHash": fileHash, "auctionType": auctionType, "creator": creator, "tokenSymbol": tokenSymbol, tokenName: tokenName, status: status, tokenAddress: Project.token });
            }
            console.log(allAuctions)
            setAuctions(allAuctions)
            
        } catch (error) {
            return false;
        }
    }, [])

    useEffect(async () => {
        try {

            const provider = await new ethers.providers.Web3Provider(window.ethereum)
            const signer = await provider.getSigner()
            var auctionDetails;
            
            auctions.forEach(element => {
                if (element.id == projectId) {


                    auctionDetails = element
                    setAuctiontype(element.auctionType)
                }

            });
            console.log("AUCTIONS", await auctionDetails)
            setAuction(auctionDetails)
           


            //var auctionDetails = { "auctionAddress": aucAddress, "fileHash": fileHash, "auctionType": auctionType, "creator": creator, "tokenSymbol": tokenSymbol, tokenName: tokenName, status: status, tokenAddress: Project.token };
            let tokenSC = await new ethers.Contract(auctionDetails.tokenAddress, TokenABI.abi, provider);
            let tokenSymbol = await tokenSC.symbol();
            let tokenName = await tokenSC.name();
            var totalSupply = await tokenSC.totalSupply();

            if (auctionDetails.auctionType == "FCFSAuction") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, FCFSAuction.abi, provider);
                let price = await auctionSc.price();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = await auctionSc.totalDeposited();
                let end = await auctionSc.end();

            } else if (auctionDetails.auctionType == "UncappedAuction") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, UncappedAuction.abi, provider);
                let price = await auctionSc.price();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = auctionSc.totalDeposited();
                let end = await auctionSc.end();
            } 
             else if (auctionDetails.auctionType == "DutchAuction") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, DutchAuction.abi, provider);
                let startingPrice = fixedNumberToNumber(await auctionSc.rate())
                console.log(FixedNumber.from(await auctionSc.rate()))
                let currrentPrice = fixedNumberToNumber(await auctionSc.currentRate());
                let finalPrice = fixedNumberToNumber(await auctionSc.finalRate())
                let numberOfTokenToBeDistributed = fixedNumberToNumber(await auctionSc.numberOfTokensToBeDistributed());
                let soldTokens = fixedNumberToNumber(await auctionSc.soldProjectTokens());


                setSoldTokens( soldTokens)

                setPrice(currrentPrice.toString())
                setTokenDist(numberOfTokenToBeDistributed.toString())

               

            }
        } catch (error) {
            console.log(error)
        }
    }, [auctions])


    useEffect(async () => {
        const CryptoJS = require('crypto-js');

        const provider = await new ethers.providers.Web3Provider(window.ethereum)
        const signer = await provider.getSigner()
        const registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)

        const hash = "0x" + await CryptoJS.SHA256(project.fileHex).toString()
        const projInfo = await registerContract.projectsRegistered(hash)

        if (await registerContract.whitelist(await signer.getAddress())) {
            setIswhitelisted(true)
            console.log("whitelisted bitch")
        } else {
            setIswhitelisted(false)
            console.log("NOT whitelisted bitch")
        }
        setOwner(await projInfo.proposer)
        setSigner(await signer.getAddress())

    }, [project])


    useEffect(async () => {
        if (owner == signer) {
            setIsowner(true)
        } else {
            setIsowner(false)
        }
    }, [owner, signer])

    const config = {
        headers: {
            "Content-type": "application/json",
        },
    };
    const handleEdit = async () => {
        setEditing(true);
    }

    const handleEditSubmission = async () => {
        setEditing(false);

        try {
            const apiInstance = axios.create({
                baseURL: "https://localhost:5001",
            })
            apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
            let response2 = new Promise((resolve, reject) => {
                apiInstance
                    .put("/Project/UpdateMarkDown/" + projectId + "/" + markdown
                    )
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
        } catch (error) {
            console.log(error)

        }
    }
    const navigate = useNavigate();



    return (
        <div>
            {
                ((auctionType == "DutchAuction") || (auctionType == "FCFSAuction"))?
 
                    <div>
                        <AuctionInfo projectId={projectId} auction={auction} price={price} tokenDist={tokenDist} deposit={soldToken} />
                        {price}
                    </div>

                    :
                    <div>

                    </div>
            }

        </div>
    );
};

export default Auction;
