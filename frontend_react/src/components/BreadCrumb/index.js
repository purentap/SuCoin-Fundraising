import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
// Styles
import { Wrapper, Content } from './BreadCrumb.styles';

const BreadCrumb = ({ projectTitle }) => (
  <Wrapper>
    <Content>
      <Link to='/projects'>
        <span>Projects</span>
      </Link>
      <span>|</span>
      <span>{projectTitle}</span>
    </Content>
  </Wrapper>
);

BreadCrumb.propTypes = {
  projectTitle: PropTypes.string
};

export default BreadCrumb;
