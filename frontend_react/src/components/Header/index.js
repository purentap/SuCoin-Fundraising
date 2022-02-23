import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import NavDropdown from 'react-bootstrap/NavDropdown'
import Container from 'react-bootstrap/Container'
import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button'
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from 'react-bootstrap/Modal'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useNavigate } from 'react-router-dom';
import web3 from 'web3';
import { ethers } from 'ethers';
import Cookies from 'js-cookie'

const Header = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignin, setShowSignin] = useState(false);

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [logged, setLogged] = useState(false);

  const [fname, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [mail, setMail] = useState('');
  const [signedMsg, setSignedmsg] = useState('');


  const closeShowLogIn = () => setShowLogin(false);
  const closeShowSignIn = () => setShowSignin(false);
  const openShowLogIn = () => setShowLogin(true);
  const openShowSignIn = () => setShowSignin(true);

  const navigate = useNavigate();
  const handleLogOut = () => {
    Cookies.set("token", "");
    setLogged(false);
    navigate('/');
  }


  const [account, setAccount] = useState();
  useEffect(async () => {

    if (Cookies.get("token") != "") {
      setLogged(true);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0])
        console.log("logged in", Cookies.get("token"))
      } catch (error) {

      }
    }
  })

  const handleInput = e => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (name === 'mail') setMail(value);
    if (name === 'fname') setName(value);
    if (name === 'surname') setSurname(value);


    console.log(fname, surname, mail)
  };

  const handleLogin = async () => {
    setError(false);

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const axios = require('axios')
      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      let accounts = newAccounts
      const from = web3.utils.toChecksumAddress(accounts[0]);
      let response = await axios.get('http://localhost:5000/Authentication/getnonce/' + from, {
      }, config)

      let nonce = response.data.data


      const exampleMessage = 'LOGIN: ' + nonce;


      const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`;
      const sign = await window.ethereum.request({
        method: 'personal_sign',
        params: [msg, from, 'Example password'],
      });



      console.log("Nonce is: ", nonce)
      console.log("Signedmsg is: ", sign)
      console.log("from is: ", from)

      const apiInstance = axios.create({
        baseURL: "http://localhost:5000",
      })
      let response2 = new Promise((resolve, reject) => {
        apiInstance
          .post("/Authentication/Login", {
            Address: from,
            SignedMessage: sign
          })
          .then((res) => {
            console.log(res.data)
            resolve(res)
          })
          .catch(() => {
            const err = ["Unable to add cart item. Please try again."]
            reject(err)
          })
      })
      let result = await response2
      Cookies.set('token', result.data.data)
      alert("SUCCESS")

      navigate('/');
      setLogged(true);
      setShowLogin(false)
    } catch (error) {
      alert("ERROR")
      console.log(error)
      setError(true);
    }
  }

  return (
    <>
      <Navbar sticky="top" collapseOnSelect expand="lg" bg="dark" variant="dark">
        <Container>
          <Navbar.Brand onClick={() => { navigate('/'); }}>SuRaising</Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => { navigate('/'); }}>Home</Nav.Link>
              <Nav.Link onClick={() => { navigate('/projects'); }}>Projects</Nav.Link>
              <Nav.Link onClick={() => { navigate('/auctions'); }}>Auctions</Nav.Link>
              <Nav.Link onClick={() => { navigate('/tokenSwap'); }}>Swap</Nav.Link>
              <Nav.Link onClick={() => { navigate('/apply'); }}>Apply</Nav.Link>
            </Nav>
            <Nav>
              {logged
                ?
                <NavDropdown title={account} id="collasible-nav-dropdown">
                  <NavDropdown.Item onClick={() => { navigate('/profile'); }}>Profile</NavDropdown.Item>

                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogOut}>Log Out</NavDropdown.Item>
                </NavDropdown>
                :
                <>
                  <Nav.Link onClick={handleLogin} >Log In</Nav.Link>
                  <Nav.Link onClick={openShowSignIn}>Sign Up</Nav.Link>
                </>
              }
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>



      <RegisterModal showSignin={showSignin} closeShowSignIn={closeShowSignIn}></RegisterModal>




    </>
  );
};

const RegisterModal = (props) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [logged, setLogged] = useState(false);

  const [fname, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [mail, setMail] = useState('');
  const [signedMsg, setSignedmsg] = useState('');



  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError(false);
    try {

      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const axios = require('axios')


      const newAccounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      let accounts = newAccounts

      const exampleMessage = 'REGISTER';
      const from = accounts[0];
      const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`;
      const sign = await window.ethereum.request({
        method: 'personal_sign',
        params: [msg, from, 'Example password'],
      });

      console.log("name", fname)
      console.log("sname", surname)
      console.log("uname", mail)
      console.log("mail", password)
      console.log("sign", sign)

      let req = await axios.put('https://localhost:5001/Authentication/Register', {
        name: fname,
        surname: surname,
        username: mail,
        mailAddress: password,
        signedMessage: sign,
      }, config)
      alert("YYSUCCESS")
      console.log(req)

      navigate('/');
    } catch (error) {
      setError(true);
      alert("ERROR")
      console.log(error)
    }
  }

  const handleInput = e => {
    const name = e.currentTarget.name;
    const value = e.currentTarget.value;

    if (name === 'fname') setName(value);
    if (name === 'surname') setSurname(value);
    if (name === 'username') setUsername(value);
    if (name === 'mail') setMail(value);
    if (name === 'signedMsg') setSignedmsg(value);
  };

  return (

    <Modal show={props.showSignin} onHide={props.closeShowSignIn} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Sign Up</Modal.Title>
      </Modal.Header>

      <Container style={{ padding: "2rem" }}>

        <FloatingLabel controlId="floatingInput" label="First Name" className="mb-3" >
          <Form.Control type="fname" placeholder="First Name" name='fname' value={fname} onChange={handleInput} />
        </FloatingLabel>

        <FloatingLabel controlId="floatingPassword" label="Surname" className="mb-3">
          <Form.Control type="surname" placeholder="Surname" name='surname' value={surname} onChange={handleInput} />
        </FloatingLabel>

        <FloatingLabel controlId="floatingPassword" label="Username" className="mb-3">
          <Form.Control type="mail" placeholder="Username" name='username' value={username} onChange={handleInput} />
        </FloatingLabel>

        <FloatingLabel controlId="floatingPassword" label="E-mail" className="mb-3">
          <Form.Control type="email" placeholder="E-mail" name='mail' value={mail} onChange={handleInput} />
        </FloatingLabel>

        <Row className="justify-content-md-center">
          <Col md="auto">
            <Button variant="primary" type="submit" onClick={handleSignUp}>
              Sign Up
            </Button>
          </Col>
        </Row>
      </Container>
    </Modal>
  )
}

export default Header;