import React, { useState, useContext, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom';
import API from '../API';
import Select from 'react-select'
import { jsPDF } from "jspdf";
// Components
import MDEditor from "@uiw/react-md-editor";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Col'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
// Styles
import { Wrapper, WrapperFile } from './Projects.styles';
import Web3 from 'web3';

import UserContext from '../User';
import LoadingButton from './LoadingButton';
import ToastBar from './Toast';
import ProjectRegister from '../abi/project.json'
import Cookies from 'js-cookie'
import axios from "axios"
import abi from '../abi/project.json'
import { ethers } from 'ethers';
import ethersAbi from '../contracts_hardhat/artifacts/contracts/ProjectRegister.sol/ProjectRegister.json'

import { useEffect } from 'react';

const options = [
	{ value: 'fens', label: 'FENS' },
	{ value: 'fass', label: 'FASS' },
	{ value: 'fman', label: 'FMAN' }
]

const Apply = () => {

	const navigate = useNavigate()

	useEffect(async () => {
		try {
		  const apiInstance = axios.create({
			baseURL: "https://localhost:5001",
		  });
		  apiInstance.defaults.headers.common[
			"Authorization"
		  ] = `Bearer ${Cookies.get("token")}`;
		  let response2 = new Promise((resolve, reject) => {
			apiInstance
			  .get("/User/Get")
			  .then((res) => {
				console.log("response: ", res.data);
				resolve(res);
			  })
			  .catch((e) => {
				const err = "Unable to  get the user";
				navigate("/notAuthorized"); 

				reject(err);
			  });
		  });
		
		} catch (error) {
		  console.log(error);
		}
	  }, []);

	const user = useContext(UserContext);
	const [projectName, setName] = useState('');
	const [projectDescription, setDescription] = useState('');
	const [error, setError] = useState(false);

	const [toastShow, setToastshow] = useState(false);
	const [toastText, setToasttext] = useState();
	const [toastHeader, setToastheader] = useState();

	const [isLoading, setLoading] = useState(false)

	const [fileToSubmit, setFile] = useState();
	const [imageToSubmit, setImage] = useState();

	const [fileName, setFilename] = useState();
	const [imageName, setImagename] = useState();

	const [hashToSubmit, setHash] = useState();

	const [txConfirmed, setTxconfirmed] = useState(false);

	const connectToContract = async () => {
		setLoading(true)
		setToastshow(true)
		setToastheader("Signing the Transaction")
		setToasttext("Please sign the transaction from your wallet.")

		try {
			// We connect to the Contract using a Provider, so we will only
			// have read-only access to the Contract
			const provider = await new ethers.providers.Web3Provider(window.ethereum)
			const signer = await provider.getSigner()

			var registerContract = await new ethers.Contract(abi.address, ethersAbi.abi, signer)
			var registerTx = await registerContract.registerProject("0x" + hashToSubmit)

			setToastshow(false)
			setToastshow(true)
			setToastheader("Pending Transaction")
			setToasttext("Waiting for transaction confirmation.")

			let receipt = await registerTx.wait()

			setToastshow(false)
			setToastshow(true)
			setToastheader("Transaction Confirmed")
			setToasttext("Your transaction is confirmed. Now, you can submit the project to our database.")

			setTxconfirmed(true)
			setLoading(false)

			console.log("RESULT: ", receipt)
			if (typeof receipt !== "undefined") {
				return true;
			}
			return false;
		}
		catch (error) {
			setToastshow(true)
			setToastheader("Catched an error")
			setToasttext(error.data)
			return false;
		}
	}

	const handleDB = async (file) => {
		setLoading(true)
		try {
			const apiInstance = axios.create({
				baseURL: "https://localhost:5001",
			})
			apiInstance.defaults.headers.common["Authorization"] = `Bearer ${Cookies.get('token')}`
			let response2 = new Promise((resolve, reject) => {
				apiInstance
					.post("/Project/Add", {
						fileHex: fileToSubmit,
						projectName: projectName,
						projectDescription: projectDescription,
						imageUrl: imageToSubmit,
					})
					.then((res) => {
						setToastshow(false)
						setToastshow(true)
						setToastheader("Succesfull")
						setToasttext("Your project is submitted to our database.")
						console.log("response: ", res.data)
						resolve(res)
					})
					.catch((e) => {
						const err = e.response.data
						reject(err)

					})
			})
			let result = await response2
			console.log(result)
			setLoading(false)
			setHash(result?.data?.data?.fileHash)
		} catch (error) {
			setLoading(false)
			setToastshow(true)
			setToastheader("Failure")
			setToasttext(error.data)
		}
	}

	const downloadFile = async () => {
		const reader = new FileReader()
		const x = Buffer.from(fileToSubmit, 'hex')
		const blob = new Blob([x.buffer]);

		reader.readAsArrayBuffer(blob);
		reader.onloadend = async () => {
			const data = window.URL.createObjectURL(blob);
			const tempLink = await document.createElement('a');
			tempLink.href = data;
			tempLink.download = fileName; // some props receive from the component.
			tempLink.click();
		}
	}

	const handleInput = e => {
		const name = e.currentTarget.name;
		const value = e.currentTarget.value;

		if (name === 'name') setName(value);
		if (name === 'description') setDescription(value);

	};

		console.log(hashToSubmit)

	return (
		<>
			<div className="sectionName" style={{paddingLeft:"50px", paddingTop:"25px", paddingBottom:"25px"}}>Apply Project</div>
			<ToastBar toastText={toastText} toastHeader={toastHeader} toastShow={toastShow} setToastshow={setToastshow}></ToastBar>
			<Wrapper>
				<Container style={{ width: "30%" }}  >
					<Row className="g-2">
						<Col md>
							<FloatingLabel controlId="floatingInputGrid" label="Project Name">
								<Form.Control onChange={handleInput} name="name" type="email" placeholder="name@example.com" />
							</FloatingLabel>
						</Col>
						{/*
						<Col md>
							<FloatingLabel controlId="floatingSelectGrid" label="Faculty">
								<Form.Select >
									<option value="1">FENS</option>
									<option value="2">FASS</option>
									<option value="3">FMAN</option>
								</Form.Select>
							</FloatingLabel>
						</Col>*/
						}
					</Row>
					<br></br>

					<Row >
						<Col>
							<FloatingLabel controlId="floatingTextarea2" label="About the Project">
								<Form.Control
									onChange={handleInput}
									name="description"
									as="textarea"
									placeholder="Leave a comment here"
									style={{ height: '150px' }}
								/>
							</FloatingLabel>
						</Col>

					</Row>
					<br></br>
					<Row >
						<MyDropzone setFile={setFile} setFilename={setFilename} fileType="Whitepaper"></MyDropzone>
						<MyDropzone setFile={setImage} setFilename={setImagename} fileType="Image"></MyDropzone>
					</Row>
					<br></br>
					<Row style={{ paddingLeft: "10%" }}>
						{hashToSubmit != null ?
							<Col style={{ justifyContent: "center", alignItems: "center" }}>
								<LoadingButton show={isLoading} text={"Submit to Chain"} variant="dark" func={connectToContract}> </LoadingButton>
							</Col>
							:
							<Col style={{ justifyContent: "center", alignItems: "center" }}>
								<LoadingButton show={isLoading} text={"Submit to Database"} variant="dark" func={handleDB}> </LoadingButton>
							</Col>
						}
						<Col style={{ justifyContent: "center", alignItems: "center" }}>
							<Button variant="dark" onClick={() => { downloadFile() }}> Download the File</Button>
						</Col>
					</Row>
				</Container>
			</Wrapper >

		</>
	);
};

function MyDropzone({ setFile, setFilename,fileType }) {

	console.log(fileType)

	function buf2hex(buffer) { // buffer is an ArrayBuffer
		return [...new Uint8Array(buffer)]
			.map(x => x.toString(16).padStart(2, '0'))
			.join('');
	}

	const onDrop = useCallback(acceptedFiles => {
		acceptedFiles.forEach(async (file) => {

			const CryptoJS = require('crypto-js');

			const reader = new FileReader()
			//reader.readAsBinaryString(file);
			reader.readAsArrayBuffer(file)
			console.log("fff", file)
			setFilename(file.path)
			reader.onabort = () => console.log('file reading was aborted')
			reader.onerror = () => console.log('file reading has failed')

			reader.onloadend = async () => {
				//handleContract(await buf2hex(reader.result ).toString(), CryptoJS.SHA256(await buf2hex(reader.result)).toString())
				setFile(await buf2hex(reader.result).toString())

			
	
			}
		})
	}, [])
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
	return (
		<div {...getRootProps()} style={{
			width: "100%", height: "100px", backgroundColor: "#ffffff",
			borderRadius: "10px", border: "2px solid #21252A"
		}}>
			<input {...getInputProps()} />
			{
				isDragActive ?
					<p style={{
						textAlign: "center",
						verticalAlign: "middle",
						lineHeight: "90px"
					}}>Yeah, just like that</p> :
					<p style={{
						textAlign: "center",
						verticalAlign: "middle",
						lineHeight: "90px"
					}} >Drop your file {fileType} here, or click to select.</p>
			}
		</div >
	)
}

export default Apply;