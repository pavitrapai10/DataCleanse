import React, { useState, useEffect } from 'react';
import './Overlay.css';

const Overlay = ({ data, objectType, onClose, onSave }) => {
  const [formData, setFormData] = useState(data);
  const [lastChangedField, setLastChangedField] = useState({});

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleChange = (e, path) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData };
    let field = updatedFormData;

    path.forEach((p, idx) => {
      if (idx === path.length - 1) {
        field[p] = value;
      } else {
        field = field[p];
      }
    });

    setFormData(updatedFormData);
    setLastChangedField({ [name]: value });
  };

  const handleSave = async () => {
    const field = Object.keys(lastChangedField)[0];
    const value = lastChangedField[field];

    const updatedCellData = {
      object: objectType,
      id: formData.Id,
      field: field,
      value: value,
    };
    console.log(updatedCellData, "UPDATED CELL");

    try {
      const response = await fetch('http://127.0.0.1:8000/salesforce/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCellData),
      });

      if (!response.ok) {
        throw new Error('Failed to update cell data');
      }

      onSave(updatedCellData);
    } catch (error) {
      console.error('Error updating cell data:', error);
      // Handle error
    }

    onClose();
  };

  const renderFields = (data, path = []) => {
    return Object.keys(data).map((key) => {
      if (typeof data[key] === 'object' && data[key] !== null) {
        if (Array.isArray(data[key])) {
          return (
            <div key={key}>
              <h3>{key}</h3>
              {data[key].map((item, index) => (
                <div key={index}>
                  <h4>{key.slice(0, -1)} {index + 1}</h4>
                  {renderFields(item, [...path, key, index])}
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div key={key}>
              <h3>{key}</h3>
              {renderFields(data[key], [...path, key])}
            </div>
          );
        }
      } else {
        const fieldPath = [...path, key].join('.');
        return (
          <div key={fieldPath}>
            <label>{key}</label>
            <input
              type="text"
              name={fieldPath}
              value={data[key] || ''}
              onChange={(e) => handleChange(e, [...path, key])}
            />
          </div>
        );
      }
    });
  };

  return (
    <div className="overlay show">
      <div className="overlay-content scrollable">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{objectType} Overview</h2>
        {renderFields(formData)}
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default Overlay;
