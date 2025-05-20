import React, { useState, useRef } from 'react';
import { FiMic, FiFileText, FiMail, FiUpload, FiX, FiGlobe } from 'react-icons/fi';
import './TextFieldOverlay.css';

const LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-US' },
  { code: 'hi', label: 'Hindi', speechCode: 'hi-IN' },
  { code: 'mr', label: 'Marathi', speechCode: 'mr-IN' },
  { code: 'ta', label: 'Tamil', speechCode: 'ta-IN' },
  { code: 'gu', label: 'Gujarati', speechCode: 'gu-IN' },
  { code: 'kn', label: 'Kannada', speechCode: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', speechCode: 'ml-IN' },
  { code: 'pa', label: 'Punjabi', speechCode: 'pa-IN' },
  { code: 'ur', label: 'Urdu', speechCode: 'ur-IN' },
  { code: 'bn', label: 'Bengali', speechCode: 'bn-IN' },
  { code: 'te', label: 'Telugu', speechCode: 'te-IN' },
  { code: 'es', label: 'Spanish', speechCode: 'es-ES' },
  { code: 'fr', label: 'French', speechCode: 'fr-FR' },
  { code: 'de', label: 'German', speechCode: 'de-DE' },
 
  // Add more languages as needed
];

const TextFieldOverlay = ({
  value,
  onClose,
  onSave,
  rowId,
  activeTab,
  context, // <-- added context prop
}) => {
  const [text, setText] = useState(value || '');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const langBtnRef = useRef(null);

  // Find the correct speech recognition code for the selected language
  const getSpeechLang = () => {
    const langObj = LANGUAGES.find(l => l.code === language);
    return langObj ? langObj.speechCode : 'en-US';
  };

  // Speech recognition logic
  const handleMic = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true; // <-- Listen continuously
      recognition.lang = getSpeechLang();
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = function () {
        setIsRecognizing(true);
      };

      recognition.onresult = function (event) {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setText(prev => prev ? prev + ' ' + transcript : transcript);
        // Don't set isRecognizing to false here, let user stop manually
      };

      recognition.onerror = function () {
        setIsRecognizing(false);
      };

      recognition.onend = function () {
        setIsRecognizing(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser.');
    }
  };

  const handleSummarise = async () => {
  setLoading(true);
  try {
    const response = await fetch('http://127.0.0.1:8000/summarise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paragraph: text,
        record_id: rowId,
        object: activeTab,
        context: context,
        language: language,
      }),
    });
    const data = await response.json();
    setSummary(data.summary || 'No summary returned.');
    // Optionally update context with formatted version from backend:
    // if (data.context) setQueriedContext(data.context);
  } catch (err) {
    setSummary('Error fetching summary.');
  }
  setLoading(false);
};
  const handleEmailDraft = () => alert('Email draft not implemented.');
  const handleUploadAudio = () => alert('Audio upload not implemented.');

  const handleSave = () => {
    onSave(rowId, text);
    onClose();
  };

  return (
    <div className="textfield-overlay right-overlay">
      <div className="textfield-overlay-content right-content">
        <div className="overlay-header">
          <div />
          <button className="close-btn" onClick={onClose} title="Close">
            <FiX size={22} />
          </button>
        </div>
        <div className="note-bar-row">
          <button
            className={`note-bar-btn speak-btn${isRecognizing ? ' active' : ''}`}
            onClick={handleMic}
            title="Speak to Note"
            disabled={isRecognizing}
          >
            <span className="speak-btn-inner">
              <FiMic size={22} />
            </span>
            <span style={{ marginLeft: 10 }}>
              {isRecognizing ? 'Listening...' : 'Speak to Note'}
            </span>
          </button>
          {isRecognizing && (
            <button className="note-bar-btn" onClick={() => recognitionRef.current && recognitionRef.current.stop()}>
              Stop Listening
            </button>
          )}
          <button className="note-bar-btn" onClick={handleSummarise} title="AI Notes">
            <FiFileText /> AI Notes
          </button>
          <button className="note-bar-btn" onClick={handleEmailDraft} title="Email Draft">
            <FiMail /> Email Draft
          </button>
          <button className="note-bar-btn" onClick={handleUploadAudio} title="Upload Audio">
            <FiUpload /> Upload Audio
          </button>
          <div className="lang-btn-wrapper" ref={langBtnRef}>
            <button
              className="note-bar-btn lang-btn"
              onClick={() => setShowLangDropdown((v) => !v)}
              title="Select Language"
              type="button"
            >
              <FiGlobe /> Language
            </button>
            <span style={{ marginLeft: 8, fontWeight: 500 }}>
              {LANGUAGES.find(l => l.code === language)?.label}
            </span>
            {showLangDropdown && (
              <div className="lang-dropdown" style={{ minWidth: 120 }}>
                {LANGUAGES.map(lang => (
                  <div
                    key={lang.code}
                    className={`lang-option${lang.code === language ? ' selected' : ''}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangDropdown(false);
                    }}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={8}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Type or paste your note here..."
        />
        {context && (
          <div style={{ marginBottom: 10 }}>
            <strong>Queried Context Data:</strong>
            <pre style={{ background: "#f6f6f6", padding: 8, borderRadius: 4, maxHeight: 200, overflow: "auto", fontSize: 13 }}>
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        )}
        <div>
          <strong>Summary:</strong>
          <div className="summary-area">
            {loading ? 'Summarizing...' : summary}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TextFieldOverlay;
