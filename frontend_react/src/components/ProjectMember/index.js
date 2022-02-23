import React from 'react';
import PropTypes from 'prop-types';
import NoImage from '../../images/no_image.jpg';
// Styles
import { Wrapper, Image } from './ProjectMember.styles';

const ProjectMember = ({ name, character, imageUrl }) => (
  <Wrapper>
    <Image src={imageUrl} alt='member-thumb' />
    <h3>{name}</h3>
    <p>{character}</p>
  </Wrapper>
);

ProjectMember.propTypes = {
  name: PropTypes.string,
  character: PropTypes.string,
  imageUrl: PropTypes.string,
}

export default ProjectMember;
