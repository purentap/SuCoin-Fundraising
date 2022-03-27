import styled from 'styled-components';

export const Card = styled.div`
    .card {
        background-color: black;
        border-radius: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        padding: 1rem;
        width: 20rem;
      }
}`;


export const Wrapper = styled.div`
  color: var(--black);
  background: white;
  border-radius: 20px;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
  padding: 5px;
  width: 20rem;
  height: 30rem;
  margin-left: 20px;
  margin-top: 20px;
  
  h1{
      margin-top: 10px;
      margin-left: 10px;
  }
  h3 {
    margin: 10px 0 0 0;
  }
  h5 {
    margin-top: 10px;
    margin-left: 10px;
  }

  p {
    margin: 5px 0;
  }
`;