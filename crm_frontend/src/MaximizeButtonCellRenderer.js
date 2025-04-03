// MaximizeButtonCellRenderer.js
import React from 'react';
import './MaximizeButtonCellRenderer.css';

const MaximizeButtonCellRenderer = ({ data, onMaximize }) => {
  const handleMaximize = () => {
    onMaximize(data);
  };

  return (
    <button onClick={handleMaximize} className="maximize-button">
      ⤢
    </button>
  );
};

export default MaximizeButtonCellRenderer;
