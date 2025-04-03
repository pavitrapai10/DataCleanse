import React, { useState } from 'react';
import './FilterInput.css';
import mic from './icons8-mic-24.png';
import expandIcon from './expand.svg';
import collapseIcon from './collapse.svg';
import clearIcon from './clearIcon.png'; // Import the clear icon image
import logoImage from './Preview.png'; // Import the logo image


const FilterInput = ({ filterQuery, handleFilterQueryChange, onSubmitFilter, setFilterQuery, onClearFilters }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecognizing, setIsRecognizing] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleClearClick = () => {
    onClearFilters(); // Call the callback passed from App.js
    setFilterQuery('');
    };

    const startRecognition = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 10;

            recognition.onstart = function () {
                setIsRecognizing(true);
                console.log('Voice recognition started. Try speaking into the microphone.');
            };

            recognition.onresult = async function (event) {
                const transcript = event.results[0][0].transcript;
                setFilterQuery(transcript);  // Update the state with the recognized text

                // Send the API POST request with the recognized text
                try {
                    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ transcript })
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const data = await response.json();
                    console.log('POST response data:', data);
                } catch (error) {
                    console.error('There was a problem with the fetch operation:', error);
                    alert('Failed to send data. Please try again.');
                }

                onSubmitFilter(transcript);
            };

            recognition.onerror = function (event) {
                setIsRecognizing(false);
                console.error('Recognition error:', event.error);
                if (event.error === 'network') {
                    alert('Network error. Please check your internet connection and try again.');
                } else {
                    alert('Recognition error. Please try again.');
                }
            };

            recognition.onend = function () {
                setIsRecognizing(false);
                console.log('Voice recognition ended.');
            };

            // Start recognition
            recognition.start();
        } else {
            console.error('Speech recognition not supported in this browser.');
            alert('Speech recognition not supported in this browser.');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            onSubmitFilter(filterQuery);
        }
    };


    return (
        <div className='inputarea'>
            <div className={`filter-container ${isExpanded ? 'expanded' : ''}`}>
                <div className='titlesection'>
                    <img src={logoImage} alt="logo" className="logo-image" />
                </div>
                {isExpanded && (
                    <div
                        className="expand-text"
                        style={{ opacity: isExpanded ? "1" : "0" }}
                    >
                        Talk to your CRM! <br />
                    </div>
                )}
                <div className="input-container">
                    <div className="input-wrapper">
                        <img src={mic} className={`mic-button ${isRecognizing ? 'active' : ''}`} alt="mic" onClick={startRecognition} />
                        <input
                            className='prompt-input'
                            type="text"
                            value={filterQuery}
                            onChange={handleFilterQueryChange}
                            onKeyDown={handleKeyDown}
                            //onKeyDown={handleKeyPress}
                            placeholder="Enter your prompt"
                        />
                        {filterQuery && (
                            <img
                                src={clearIcon}
                                className="clear-button"
                                alt="clear"
                                onClick={handleClearClick}
                            />
                        )}
                    </div>
                </div>
                <img
                    src={isExpanded ? collapseIcon : expandIcon}
                    style={{ height: '20px', width: '20px', cursor: 'pointer' }}
                    alt="collapse-expand-icon"
                    className="expand-button"
                    onClick={toggleExpand}
                />
            </div>
        </div>
    );
};

export default FilterInput;
