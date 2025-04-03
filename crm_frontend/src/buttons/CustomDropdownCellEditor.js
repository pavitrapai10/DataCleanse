import React, { useState, useEffect, useRef } from 'react';

const CustomDropdownCellEditor = (props) => {
  const [value, setValue] = useState(props.value);
  const dropdownRef = useRef();

  useEffect(() => {
    dropdownRef.current.focus();
  }, []);

  const onChange = (event) => {
    const selectedValue = event.target.value;
    setValue(selectedValue);
    // Update the cell's value in the grid
    props.api.stopEditing();
    props.api.getRowNode(props.node.id).setDataValue(props.column.colId, selectedValue);
    // Save the selected value in local storage
   //localStorage.setItem('selectedValue', selectedValue);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      props.stopEditing();
    }
  };

  return (
    <select
      ref={dropdownRef}
      value={value}
      onChange={onChange}
      onBlur={props.stopEditing}
      onKeyDown={onKeyDown}
      style={{ width: '100%' }}
    >
      {props.options.map((option) => (
        <option key={option.id} value={option.name}>
          {option.name}
        </option>
      ))}
    </select>
  );
};

export default CustomDropdownCellEditor;
