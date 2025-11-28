import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'regenerator-runtime/runtime';

// Props: onSpeechInput (function to send text to parent)
const Sidebar = ({ onSpeechInput }) => {
  const [language, setLanguage] = useState('en-IN'); // Default Language

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Whenever transcript changes (user speaks), send it to Parent
  useEffect(() => {
    if (onSpeechInput) {
      onSpeechInput(transcript);
    }
  }, [transcript, onSpeechInput]);

  // Handle Start/Stop
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: language });
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  return (
    // --- CHANGE: Height reduced to [calc(100vh-128px)] to leave space for footer ---
    // 64px (Header) + 64px (Footer) = 128px
    <aside className="w-72 bg-white h-[calc(100vh-128px)] border-r border-gray-200 p-4 overflow-y-auto fixed left-0 top-16 z-40">
      
      {/* Speech Input Card */}
      <ToolCard title="SPEECH INPUT" icon="🎙️">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi</option>
          <option value="mr-IN">Marathi</option>
        </select>
        
        <button 
          onClick={toggleListening}
          className={`w-full py-2.5 rounded font-medium flex items-center justify-center gap-2 transition shadow-sm text-white ${
            listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <span>{listening ? '⏹️' : '🎙️'}</span> 
          {listening ? 'Stop Listening' : 'Start Listening'}
        </button>
        
        {/* Reset Button (Optional) */}
        {listening && (
           <button onClick={resetTranscript} className="text-xs text-red-500 mt-2 hover:underline w-full text-center">
             Clear Speech
           </button>
        )}
      </ToolCard>

      {/* Translation Card */}
      <ToolCard title="TRANSLATION" icon="🈯">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>English</option>
          <option>Hindi</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded flex items-center justify-center transition">
          ⇄ Swap
        </button>
      </ToolCard>

      {/* Transliteration Card */}
      <ToolCard title="TRANSLITERATION" icon="⌨️">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>Hindi</option>
          <option>Marathi</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded font-medium transition">
          Enable
        </button>
      </ToolCard>

      {/* Font Conversion Card */}
      <ToolCard title="FONT CONVERSION" icon="A">
        <select className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none">
          <option>Krutidev</option>
          <option>Mangal</option>
        </select>
        <button className="w-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded flex items-center justify-center transition">
          Convert
        </button>
      </ToolCard>

    </aside>
  );
};

// Helper Component for uniform cards
const ToolCard = ({ title, icon, children }) => (
  <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100">
    <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
      <span className="bg-white p-1 rounded shadow-sm">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

export default Sidebar;