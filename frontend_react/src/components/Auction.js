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

import { ethers } from 'ethers';
import ethersAbi from '../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'
import abi from '../abi/project.json'

import MaestroABI from '../contracts_hardhat/artifacts/contracts/Maestro.sol/Maestro.json';
import CappedFCFS from '../contracts_hardhat/artifacts/contracts/CappedFCFSAuction.sol/CappedFCFSAuction.json';
import CappedParcelLimitFCFS from '../contracts_hardhat/artifacts/contracts/CappedParcelLimitFCFSAuction.sol/CappedParcelLimitFCFSAuction.json';
import CappedAuctionWRedistribution from '../contracts_hardhat/artifacts/contracts/CappedAuctionWRedistribution.sol/CappedAuctionWRedistribution.json';
import DutchAuction from '../contracts_hardhat/artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import TokenABI from '../contracts_hardhat/artifacts/contracts/Token.sol/Token.json';
import { WalletSwitcher } from '../User';
const MaestroAddress = "0x4ED02B5dA043d8c9882f11B9784D67f2a7E9cC7C";
const CappedFCFSAddress = "0x43f691a5D43Dd8edbDa222c6a0de967E52a23db2"

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
    const [deposit, setDeposit] = useState();



    const [auctionType, setAuctiontype] = useState();

    const [auctions, setAuctions] = useState([
        {
            "auctionAddress": "0x98f2C2aFB088bE9378a4dEb2672Af309E9b65329",
            "fileHash": "0xa190d2b3a3323f420e5df6078d27bf6d7d76144aea19e32cb66ff61b4ad07d2d",
            "auctionType": "CappedFCFS",
            "creator": "0xDE02A36403d7a38eB9D6a8568599Ef6CDf18315b",
            "tokenSymbol": "Lira",
            "tokenName": "BiLira",
            "status": "notStarted",
            "tokenAddress": "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3"
        },
        {
            "auctionAddress": "0x38a758A743Df330182Aa3988090d40b791823255",
            "fileHash": "0x4fd063a659cd3fe36b2ae58f30c5b7e36e5b0e10fcc2e447ebd76a5443ea2689",
            "auctionType": "CappedFCFS",
            "creator": "0xDE02A36403d7a38eB9D6a8568599Ef6CDf18315b",
            "tokenSymbol": "Lira",
            "tokenName": "BiLira",
            "status": "notStarted",
            "tokenAddress": "0xc8a80f82876C20903aa8eE1e55fa9782Aa9Ed3c3"
        }
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
                let auctionSc = await new ethers.Contract(aucAddress, (auctionType == 'CappedFCFS' ? CappedFCFS.abi : (auctionType == 'CappedAuctionWRedistribution' ? CappedAuctionWRedistribution.abi : (auctionType == "CappedParcelLimitFCFSAuction" ? CappedParcelLimitFCFS.abi : (auctionType == "DutchAuction" ? DutchAuction : DutchAuction)))), provider);
                let isFinished = await auctionSc.isFinished();
                let isStarted = await auctionSc.isStarted();
                var status;
                if (isStarted && !isFinished) {
                    status = "Ongoing";
                }
                else if (isStarted && isFinished) {
                    status = "Finished";
                } else if (!isStarted) {
                    status = "notStarted";
                }

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
            setAuctions(allAuctions)
            console.log(allAuctions);
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
            setTimeout(function () {
                //do what you need here
            }, 4000);

            //var auctionDetails = { "auctionAddress": aucAddress, "fileHash": fileHash, "auctionType": auctionType, "creator": creator, "tokenSymbol": tokenSymbol, tokenName: tokenName, status: status, tokenAddress: Project.token };
            let tokenSC = await new ethers.Contract(auctionDetails.tokenAddress, TokenABI.abi, provider);
            let tokenSymbol = await tokenSC.symbol();
            let tokenName = await tokenSC.name();
            var totalSupply = await tokenSC.totalSupply();
            if (auctionDetails.auctionType == "CappedFCFS") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, CappedFCFS.abi, provider);
                let price = await auctionSc.price();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = await auctionSc.totalDeposited();
                let end = await auctionSc.end();
                setPrice(price.toString())
                setTokenDist(numberOfTokenToBeDistributed.toString())
                setDeposit(totalDeposited.toString())

                console.log(price, numberOfTokenToBeDistributed, totalDeposited)
            } else if (auctionDetails.auctionType == "CappedAuctionWRedistribution") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, CappedAuctionWRedistribution.abi, provider);
                let price = await auctionSc.price();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = auctionSc.totalDeposited();
                let end = await auctionSc.end();
            } else if (auctionDetails.auctionType == "CappedParcelLimitFCFS") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, CappedParcelLimitFCFS.abi, provider);
                let price = await auctionSc.price();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = auctionSc.totalDeposited();
                let end = await auctionSc.end();
                let limit = await auctionSc.limit();
            } else if (auctionDetails.auctionType == "DutchAuction") {
                let auctionSc = await new ethers.Contract(auctionDetails.auctionAddress, DutchAuction.abi, provider);
                let startingPrice = await auctionSc.startingPrice();
                let priceDeductionRate = await auctionSc.priceDeductionRate();
                let numberOfTokenToBeDistributed = await auctionSc.numberOfTokensToBeDistributed();
                let totalDeposited = auctionSc.totalDeposited();
                let end = await auctionSc.end();
                let limit = await auctionSc.limit();
                let minPrice = await auctionSc.minPrice();
                let currrentPrice = await auctionSc.finalPrice();
            }
        } catch (error) {

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
                auctionType == "CappedFCFS" ?

                    <div>
                        <AuctionInfo projectId={projectId} auction={auction} price={price} tokenDist={tokenDist} deposit={deposit} />
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
