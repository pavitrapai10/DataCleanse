import React, { useState, useRef } from 'react';

const HoverDeleteCellRenderer = (props) => {
  const [hovered, setHovered] = useState(false);
  const cellRef = useRef(null);

  const onMouseEnter = () => {
    setHovered(true);
  };

  const onMouseLeave = () => {
    setHovered(false);
  };

  const handleDelete = async () => {
  const { data, colDef, api, node, objectType } = props;
  const { id } = data;

  try {
    const response = await fetch('http://127.0.0.1:8000/salesforce/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "object": objectType, // Use dynamic object type here
        "operation": "delete",
        "id": data.Id
      }),
    });

    console.log(objectType);
    console.log(data.Id);

    if (!response.ok) {
      throw new Error(`Failed to delete data: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Server response:', result);

    // Check if the result is successful
    if (result.success) {
      // Update the grid state to remove the deleted cell value
      const updatedData = { ...data, [colDef.field]: null };
      node.setData(updatedData);
      api.applyTransaction({ update: [updatedData] });

      // Optionally update local storage if necessary
      // Assuming you have a function passed via props to handle this
      if (props.onDeleteCell) {
        props.onDeleteCell(id, colDef.field);
      }
    } else {
      throw new Error('Failed to delete data: Server response indicates failure');
    }
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};
  return (
    <div
      ref={cellRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
    >
      <span>{props.value}</span>
      {hovered && (
        <button
          onClick={handleDelete}
          style={{
            marginLeft: '5px',
            color: 'red',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          X
        </button>
      )}
    </div>
  );
};

export default HoverDeleteCellRenderer;
