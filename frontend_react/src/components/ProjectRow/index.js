import React from 'react';
import PropTypes from 'prop-types';
import NoImage from '../../images/no_image.jpg';
// Styles
import { Wrapper, Image, Col, ColumnInfo } from './ProjectRow.styles';
import { Link } from 'react-router-dom';

export const ProjectRow = ({ id, title, faculty }) => (

  <Link to={'/projects/'} >
    {console.log(id)}
    <Wrapper  >
      <Col><p>{id}</p></Col>
      <Col><p>{title}</p></Col>
      <Col><p>{faculty}</p></Col>
    </Wrapper>
  </Link >
);

ProjectRow.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  faculty: PropTypes.string,
}

export const ProjectRowDetails = ({ id, title, faculty }) => (
  <ColumnInfo>
    <Col><h3>{id}</h3></Col>
    <Col><h3>{title}</h3></Col>
    <Col><h3>{faculty}</h3></Col>
  </ColumnInfo>
);

ProjectRow.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  faculty: PropTypes.string,
}

export default ProjectRow;
