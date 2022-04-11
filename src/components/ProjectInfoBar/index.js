import React from 'react';
import PropTypes from 'prop-types';
// Styles
import { Wrapper, Content } from './ProjectInfoBar.styles';

const ProjectInfoBar = ({ time, budget, revenue }) => (
  <Wrapper>
    <Content>
      <div className='column'>
        <p>Proposal Time: {"20/12/2021"}</p>
      </div>
      <div className='column'>
        <p>Tokens to be Distributed: {"Not Decided Yet"}</p>
      </div>
      <div className='column'>
        <p>Token Price: {"Not Decided Yet"}</p>
      </div>
    </Content>
  </Wrapper>
);

ProjectInfoBar.propTypes = {
  time: PropTypes.number,
  budget: PropTypes.number,
  revenue: PropTypes.number
};

export default ProjectInfoBar;
