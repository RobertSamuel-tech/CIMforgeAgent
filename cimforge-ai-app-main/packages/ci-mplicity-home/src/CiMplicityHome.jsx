import React from 'react';
import PropTypes from 'prop-types';
import CIMforgeAgentSection from './CIMforgeAgentSection';

const CiMplicityHome = ({ name = 'User' }) => {
    return <CIMforgeAgentSection />;
};

CiMplicityHome.propTypes = {
    name: PropTypes.string,
};

export default CiMplicityHome;
