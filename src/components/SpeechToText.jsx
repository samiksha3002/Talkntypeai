import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'regenerator-runtime/runtime';

const SpeechToText = () => {
  const [language, setLanguage] = useState('en-IN'); // Default English (India)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition. Please use Chrome.</span>;
  }

  // Start Listening Function
  const handleStart = () => {
    SpeechRecognition.startListening({ 
      continuous: true,   // Ruke nahi, lagatar sunta rahe
      language: language  // 'en-IN' for English, 'hi-IN' for Hindi
    });
  };

  // Stop Listening Function
  const handleStop = () => {
    SpeechRecognition.stopListening();
  };

  return (
    <div className="p-5 border rounded-lg shadow-lg bg-white max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">TNT Voice Recorder</h2>

      {/* Language Selector */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Language:</label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded bg-gray-100"
        >
          <option value="en-IN">English (India)</option>
          <option value="hi-IN">Hindi (हिंदी)</option>
        </select>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={handleStart} 
          className={`px-4 py-2 rounded text-white font-bold ${listening ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {listening ? 'Listening... 🎙️' : 'Start Speaking ▶️'}
        </button>

        <button 
          onClick={handleStop} 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop ⏹️
        </button>

        <button 
          onClick={resetTranscript} 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear 🗑️
        </button>
      </div>

      {/* Output Area */}
      <div className="h-64 p-4 bg-gray-50 border-2 border-gray-200 rounded overflow-y-auto">
        <p className="text-gray-700 text-lg leading-relaxed">
          {transcript}
        </p>
      </div>
      
      <p className="mt-2 text-sm text-gray-500">
        Note: Please use Google Chrome for best accuracy.
      </p>
    </div>
  );
};

export default SpeechToText;