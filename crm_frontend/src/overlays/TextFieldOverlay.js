import React, { useState, useRef } from 'react';
import { FiMic, FiFileText, FiMail, FiUpload, FiX, FiGlobe } from 'react-icons/fi';
import './TextFieldOverlay.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  // Add more languages as needed
];

const TextFieldOverlay = ({
  value,
  onClose,
  onSave,
  rowId,
  activeTab,
}) => {
  const [text, setText] = useState(value || '');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langBtnRef = useRef(null);

  // Summarize note using backend
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
          language: language,
        }),
      });
      const data = await response.json();
      setSummary(data.summary || 'No summary returned.');
    } catch (err) {
      setSummary('Error fetching summary.');
    }
    setLoading(false);
  };

  // Placeholder handlers for other buttons
  const handleMic = () => alert('Voice-to-text not implemented.');
  const handleEmailDraft = () => alert('Email draft not implemented.');
  const handleUploadAudio = () => alert('Audio upload not implemented.');

  const handleSave = () => {
    onSave(rowId, text);
    onClose();
  };
  console.log(rowId)

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
          <button className="note-bar-btn speak-btn" onClick={handleMic} title="Speak to Note">
            <span className="speak-btn-inner">
              <FiMic size={22} />
            </span>
            <span style={{ marginLeft: 10 }}>Speak to Note</span>
          </button>
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
