// Tooltip.js
import React from 'react';
import './Tooltip.css';

const Tooltip = ({ message }) => {
  return (
    <div className="tooltip-container">
      <span className="tooltip-icon">?</span>
      <div className="tooltip-text">
        {message}
      </div>
    </div>
  );
};

export default Tooltip;
