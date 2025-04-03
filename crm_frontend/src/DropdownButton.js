import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';

const DropdownButton = ({ options, onSelect }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <Dropdown>
      <Dropdown.Toggle variant="primary" id="dropdown-basic">
        {selectedOption || ''}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {options.map((option, index) => (
          <Dropdown.Item key={index} onClick={() => handleSelect(option)}>
            {option}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default DropdownButton;
