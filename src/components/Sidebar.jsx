import React, { useState, useEffect, useRef } from 'react';

const Sidebar = ({ onSpeechInput }) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN'); 
  
  // Ref for the Speech Recognition instance
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Speech Recognition on Component Mount
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser does not support Speech Recognition. Please use Google Chrome.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuration
    recognition.continuous = true; // Keep listening even after user pauses
    recognition.interimResults = true; // Show results while speaking (optional logic below)
    
    // 2. Handle Results
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      // Loop through results to separate final text from interim
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }

      // Send only final text to the parent component
      if (finalTranscript && onSpeechInput) {
        onSpeechInput(finalTranscript);
      }
    };

    // 3. Handle Errors
    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow permissions.");
        setIsListening(false);
      }
    };

    // 4. Handle End (Auto-restart logic if needed, or just sync state)
    recognition.onend = () => {
      // If we expect it to be listening but it stopped (silence timeout), restart it
      // Note: We check a ref or state wrapper here usually, but for simplicity:
      // We rely on the button to manually stop visually.
      // If the engine stops by itself, we update UI:
      // setIsListening(false); // Uncomment this if you want it to auto-stop UI on silence
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onSpeechInput]); // Re-run if input handler changes

  // Update Language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      // Map simple codes to Google's expected format
      let langCode = language;
      if (language === 'hi') langCode = 'hi-IN';
      if (language === 'mr') langCode = 'mr-IN';
      
      recognitionRef.current.lang = langCode;
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        // Sometimes it throws if already started
        console.log("Recognition start error (safe to ignore):", error);
        setIsListening(true);
      }
    }
  };

  return (
    <aside className="w-72 bg-white h-[calc(100vh-128px)] border-r border-gray-200 p-4 overflow-y-auto fixed left-0 top-16 z-40">
      
      {/* --- SPEECH INPUT CARD --- */}
      <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
          <span className="bg-white p-1 rounded shadow-sm text-lg">🎙️</span> Super Steno
        </h3>

        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 transition cursor-pointer"
          disabled={isListening}
        >
          <option value="en-IN">English (India)</option>
          <option value="hi">Hindi</option>
          <option value="mr">Marathi</option>
        </select>
        
        <button 
          onClick={toggleListening}
          className={`w-full py-2.5 rounded font-medium flex items-center justify-center gap-2 transition shadow-sm text-white ${
            isListening ? 'bg-red-500 animate-pulse hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <span>{isListening ? '⏹️' : '🎙️'}</span> 
          {isListening ? 'Stop Steno' : 'Start Steno'}
        </button>
        
        {isListening && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <p className="text-xs text-green-700 font-bold">
                Listening (Google Speech)
              </p>
            </div>
        )}
      </div>

      {/* --- PLACEHOLDERS (SAME AS BEFORE) --- */}
      <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100">
         <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase">
           <span className="bg-white p-1 rounded shadow-sm">🈯</span> Translation
         </h3>
         <button className="w-full border border-gray-300 text-gray-400 py-1.5 rounded text-sm cursor-not-allowed bg-gray-50">Coming Soon</button>
      </div>

      <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100">
         <h3 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase">
            <span className="bg-white p-1 rounded shadow-sm">A</span> Font Conversion
         </h3>
         <button className="w-full border border-gray-300 text-gray-400 py-1.5 rounded text-sm cursor-not-allowed bg-gray-50">Coming Soon</button>
      </div>

    </aside>
  );
};

export default Sidebar;