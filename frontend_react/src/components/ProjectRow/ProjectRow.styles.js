import styled from 'styled-components';

export const Wrapper = styled.div`
  color: var(--white);
  background: var(--darkGrey);
  border-radius: 20px;
  padding: 5px;
  margin: auto;
  text-align: center;
  width: 100%;
  height: 100%;  

  
 


  h3 {
    margin: 10px 0 0 0;
  }

  p {
    margin: 5px 0;
  }
 
`;

export const ColumnInfo = styled.div`
  color: var(--);
  background: var(--white);
  border-radius: 20px;
  padding: 5px;
  text-align: center;
  width: 100%;
  height: 100%;  
 


  h3 {
    margin: 10px 0 0 0;
    color: var(--darkGrey);
  }

  p {
    margin: 5px 0;
    color: var(--darkGrey);
  }
 
`;

export const Col = styled.div`
  float: left;
  width: 30%;
  margin: auto;
  padding: 10px;
`;

export const Image = styled.img`
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 15px;
`;
