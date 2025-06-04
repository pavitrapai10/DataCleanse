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
];

const EMAIL_TYPES = [
 "Cold Email Outreach",
"Follow-Up",
"Proposal/Information Sharing",
"Objection Handling",
"Apology/Problem Resolution",
"Closing/Won Deal",
"Closing/Lost Deal",
"Minutes of Meeting"
];

const BASE_URL = "http://127.0.0.1:8000"; // Or your backend URL

const TextFieldOverlay = ({
  value,
  onClose,
  onSave,
  rowId,
  activeTab,
  context,
}) => {
  const [text, setText] = useState(value || '');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [showEmailTypeDropdown, setShowEmailTypeDropdown] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const recognitionRef = useRef(null);
  const langBtnRef = useRef(null);
  const fileInputRef = useRef(null);

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
  const handleEmailDraft = () => {
    setShowEmailTypeDropdown(true);
    setEmailDraft('');
  };

  const handleEmailTypeSelect = async (type) => {
    setSelectedEmailType(type);
    setShowEmailTypeDropdown(false);
    setEmailLoading(true);
    setEmailDraft('');
    try {
      const response = await fetch('http://127.0.0.1:8000/email_draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraph: text,
          record_id: rowId,
          object: activeTab,
          context: context,
          email_type: type,
          language: language,
        }),
      });
      const data = await response.json();
      setEmailDraft(data.email_draft || 'No draft returned.');
    } catch (err) {
      setEmailDraft('Error fetching email draft.');
    }
    setEmailLoading(false);
  };

  const handleSave = () => {
    onSave(rowId, text);
    onClose();
  };

  const handleUploadAudio = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset file input
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = ["audio/mpeg", "audio/wav", "audio/x-m4a"];
      if (validExtensions.includes(file.type) && file.size <= 5 * 1024 * 1024) {
        setAudioLoading(true);
        setSummary('');
        setEmailDraft('');
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", language);
        formData.append("temperature", "0.0");

        try {
          const response = await fetch('http://127.0.0.1:8000/transcribe', {
            method: "POST",
            body: formData,
            // Do NOT set Content-Type header for FormData with fetch!
          });
          const data = await response.json();
          setText(data.text);
        } catch (error) {
          setSummary('Error processing audio.');
        } finally {
          setAudioLoading(false);
        }
      } else {
        setSummary('Please upload a .mp3, .wav, or .m4a file under 5 MB.');
      }
    }
  };

  // const handleAudioFileChange = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   setAudioLoading(true);
  //   setSummary('');
  //   setEmailDraft('');
  //   try {
  //     const formData = new FormData();
  //     formData.append('audio', file);
  //     formData.append('record_id', rowId);
  //     formData.append('object', activeTab);
  //     formData.append('context', JSON.stringify(context));
  //     formData.append('language', language);
  //     formData.append('email_type', selectedEmailType); // Optional, for email draft

  //     const response = await fetch('http://127.0.0.1:8000/audio_transcribe', {
  //       method: 'POST',
  //       body: formData,
  //     });
  //     const data = await response.json();
  //     if (data.transcript) setText(data.transcript);
  //     if (data.summary) setSummary(data.summary);
  //     if (data.email_draft) setEmailDraft(data.email_draft);

  //     // Optionally, auto-generate summary if not returned
  //     if (!data.summary && data.transcript) {
  //       setText(data.transcript);
  //       await handleSummarise();
  //     }
  //     // Optionally, auto-generate email draft if not returned and email type is selected
  //     if (!data.email_draft && data.transcript && selectedEmailType) {
  //       setText(data.transcript);
  //       await handleEmailTypeSelect(selectedEmailType);
  //     }
  //   } catch (err) {
  //     setSummary('Error processing audio.');
  //   }
  //   setAudioLoading(false);
  // };

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
        {/* Email type dropdown */}
        {showEmailTypeDropdown && (
          <div className="email-type-dropdown">
            <div style={{ marginBottom: 6, fontWeight: 500 }}>Choose Email Type:</div>
            {EMAIL_TYPES.map(type => (
              <div
                key={type}
                className="email-type-option"
                onClick={() => handleEmailTypeSelect(type)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: selectedEmailType === type ? '#e0e0ff' : '#fff',
                  borderBottom: '1px solid #eee'
                }}
              >
                {type}
              </div>
            ))}
            <div>
              <button onClick={() => setShowEmailTypeDropdown(false)} style={{ marginTop: 8 }}>Cancel</button>
            </div>
          </div>
        )}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={8}
          style={{ width: '100%', marginBottom: 10 }}
          placeholder="Type or paste your note here..."
        />
        {/* Email draft display */}
        {emailLoading && <div style={{ margin: '10px 0', color: '#888' }}>Generating email draft...</div>}
        {emailDraft && (
          <div style={{
            background: '#f9f9f9',
            border: '1px solid #eee',
            borderRadius: 4,
            padding: 10,
            marginBottom: 10,
            whiteSpace: 'pre-wrap'
          }}>
            <strong>{selectedEmailType}:</strong>
            <div>{emailDraft}</div>
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
        <input
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default TextFieldOverlay;
