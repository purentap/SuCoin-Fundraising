import React from 'react';
import PropTypes from 'prop-types';
// Styles
import { Wrapper, Wrapper2 } from './Button.styles';

const Button = ({ text, callback }) => (
  <Wrapper2 type='button' onClick={callback}>
    {text}
  </Wrapper2>
);

 

Button.propTypes = {
  text: PropTypes.string,
  callback: PropTypes.func
};

export default Button;
