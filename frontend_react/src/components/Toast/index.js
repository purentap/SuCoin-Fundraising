import React, { useState, useContext, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom';

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

import Web3 from 'web3';
import { ethers } from 'ethers';



import Cookies from 'js-cookie'
import axios from "axios"

import Toast from 'react-bootstrap/Toast'
import { ToastContainer } from 'react-bootstrap';

function ToastBar({ toastShow, toastText, toastHeader, setToastshow }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");

  return (
    <Row>
      <Col xs={6}>
        <ToastContainer position={'top-start'} style={{ paddingTop: "100px" }} >
          <Toast onClose={() => setToastshow(false)} show={toastShow} delay={10000} autohide>
            <Toast.Header>
              {toastHeader}
            </Toast.Header>
            <Toast.Body>{toastText}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Col>

    </Row>
  );
}

export default ToastBar;