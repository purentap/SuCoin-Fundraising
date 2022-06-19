import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

const NotAuthorized = () => {
    const navigate = useNavigate();


    useEffect(async () => {
        await delay(1000)
        navigate("/")
    })

    return <div style={{display: 'flex',  justifyContent:'center', alignItems:'center', height: '100vh'}}>
    You don't have permission to view the page you visited
    </div>

} 

export default NotAuthorized;