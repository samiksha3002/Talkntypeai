import React, { useState, useRef } from 'react';
import { createClient } from '@deepgram/sdk';

const Sidebar = ({ onSpeechInput }) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN'); 
  
  // Refs to manage connection and recorder
  const deepgramRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startDeepgram = async () => {
    try {
      setIsListening(true);
      console.log("🔵 Starting Hardcode Test...");

      // ----------------------------------------------------
      // ⚠️ TEST MODE: IGNORING BACKEND. USING DIRECT KEY.
      // ----------------------------------------------------
      const TEST_KEY = "70ac2e5488a77423e14970323441e4fef804366b"; // <--- PASTE IT HERE!

      if (TEST_KEY === "PASTE_YOUR_KEY_HERE") {
        alert("You forgot to paste the key in the code!");
        setIsListening(false);
        return;
      }

      // Setup Deepgram
      const deepgram = createClient(TEST_KEY);
      
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en", 
        smart_format: true,
      });

      connection.on("Open", () => console.log("🟢 CONNECTION OPEN! Success!"));
      
      connection.on("Results", (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        if(transcript) {
            console.log("📝 Transcript:", transcript);
            if (data.is_final && onSpeechInput) onSpeechInput(transcript + " ");
        }
      });

      connection.on("Close", (e) => console.log("🔴 Closed. Code:", e.code, "Reason:", e.reason));
      connection.on("error", (e) => console.error("🔴 Error:", e));

      deepgramRef.current = connection;

      // Start Mic (Standard Mode)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream); 
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      });

      mediaRecorder.start(250);

    } catch (error) {
      console.error("❌ Failed:", error);
      alert(error.message);
      setIsListening(false);
    }
  };  const stopDeepgram = () => {
    setIsListening(false);
    
    // Stop Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Close Deepgram Connection
    if (deepgramRef.current) {
      deepgramRef.current.finish();
      deepgramRef.current = null;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopDeepgram();
    } else {
      startDeepgram();
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
                Listening (Deepgram AI)
              </p>
            </div>
        )}
      </div>

      {/* --- PLACEHOLDERS --- */}
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