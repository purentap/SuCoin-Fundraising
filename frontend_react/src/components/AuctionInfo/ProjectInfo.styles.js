import styled from 'styled-components';

export const Wrapper = styled.div`
  color: var(--black);
  background: white;
  border-radius: 20px;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
  padding: 5px;
  width: 700px;
  height: auto;
  margin-left: 20px;
  margin-top: 20px;
  overflow-wrap: break-word;
  
  
  h1{
      margin-top: 10px;
      margin-left: 10px;
      font-family: 'Montserrat', sans-serif; 
  }
  
  h5{
    text-align: left;
    font-weight:800;
    font-size:1.2rem;
    margin-top: 10px;
    margin-left: 10px;
    font-family: 'Montserrat', sans-serif; 
  }

   p{
    margin:1rem;
    font-weight: 300;
    color: #2f2d2e;
    font-size: 1rem;
    text-align: justify;
    font-family: 'Montserrat', sans-serif; 
  }


    accept-button{
        margin:1rem;
        margin-top: 0;
        color: white;
        font:bold;
        background-color: red;
        border: 2px solid #8e00b9;
        padding: 0.6rem;
        border-radius: 6px;
        text-align: center;
        transition-duration: 0.5s;
        animation: ease-in-out; 
      }

    reject-button{
        margin:1rem;
        margin-top: 0;
        color: white;
        font:bold;
        background-color: green;
        border: 2px solid #8e00b9;
        padding: 0.6rem;
        border-radius: 6px;
        text-align: center;
        transition-duration: 0.5s;
        animation: ease-in-out; 
      }

      button{
        margin:1rem;
        margin-top: 0;
        color: #2f2d2e;
        font:bold;
        background-color: white;
        border: 2px solid #8e00b9;
        padding: 0.6rem;
        border-radius: 6px;
        text-align: center;
        transition-duration: 0.5s;
        animation: ease-in-out; 
      }

    button:hover{
      background: linear-gradient(to left, #2d00f7, #ff0291);
      transform: scale(1.2);
      border:none;
      color:white;
    }
  
    project-image{
      position: absolute;
      width: auto;
      object-fit: cover;
    }

    input-box{
        color: var(--white);
        background: black;
        width: 100%;
        padding: .5rem .8rem .5rem .8rem;
        margin: .9vw 0 ;
        border:0;
        border-radius: 20px;
        font-size: 20px;
        font-family: 'Montserrat', sans-serif;
    }

    field {
        width: 100%;
        height: 56px;
        border-radius: 50px;
        position: relative;
        background-color: rgba(255,255,255,0.3);
        transition: 0.3s all;
        font-family: 'Montserrat', sans-serif; 
      }
      
`;