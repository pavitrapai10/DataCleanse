// DropdownCellRenderer.js
import React, { useState, useEffect, useRef } from 'react';
import './DropdownCellRenderer.css'; // Import CSS for styling

const DropdownCellRenderer = (props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleButtonClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleOptionClick = (option) => {
    //console.log('Selected option:', option);
    setShowDropdown(false);
  };

  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = ['Option 1', 'Option 2', 'Option 3']; // Example options

  return (
    <div className="dropdown-cell-renderer" ref={dropdownRef}>
      <button onClick={handleButtonClick}>▼</button>
      {showDropdown && (
        <div className="dropdown-list">
          {options.map((option, index) => (
            <div
              key={index}
              className="dropdown-option"
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownCellRenderer;
