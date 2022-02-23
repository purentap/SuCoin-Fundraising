import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
   
  
  padding: 20px;
  color: var(--darkGrey);

  

  .inputlong {
    width: 100%;
    height: 80px;
    border: 1px solid var(--darkGrey);
    border-radius: 0px;
    margin: 10px 0;
    padding: 10px;
  }

  .error {
    color: red;
  }
`;

export const WrapperFile = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 0 auto;
  max-width: 320px;
  padding: 20px;
  color: var(--darkGrey);

  input {
    width: 100%;
    height: 50%;
    border: 0px solid var(--darkGrey);
   
    margin: 10px 0;
    padding: 10px;
  }

  .error {
    color: red;
  }
`;
