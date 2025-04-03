import React, { useEffect, useRef, useState } from 'react';
import { Dropdown, DropdownButton } from 'react-bootstrap';

const CustomCellEditor = (props) => {
  const { rowIndex, colDef, value } = props;
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    ref.current.focus();
  }, []);

  const handleSelect = (eventKey) => {
    setSelectedValue(eventKey);
    setIsOpen(false);
    props.stopEditing();
  };

  const handleBlur = () => {
    // Ensure the dropdown remains open if the cell editor is active
    setTimeout(() => {
      if (!isOpen) {
        props.stopEditing();
      }
    }, 200);
  };

  const handleClick = () => {
    setIsOpen(true);
  };

  // Assuming rowOptions is passed as a property containing row-specific options
  const rowOptions = props.data.options || [];

  return (
    <div ref={ref} tabIndex="0" style={{ width: '100%' }} onBlur={handleBlur} onClick={handleClick}>
      <DropdownButton
        title={selectedValue || 'Select...'}
        id={`dropdown-basic-button-${rowIndex}-${colDef.field}`}
        onSelect={handleSelect}
        show={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      >
        {rowOptions.map((option) => (
          <Dropdown.Item key={option} eventKey={option}>
            {option}
          </Dropdown.Item>
        ))}
      </DropdownButton>
    </div>
  );
};

export default CustomCellEditor;
