import React, { useState, useEffect, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// --- LIST OF SUPPORTED LANGUAGES ---
const languageOptions = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' }
];

const Sidebar = ({ onSpeechInput }) => {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  
  const connectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // ⚠️ REPLACE THIS WITH A NEW KEY (Your old one was exposed!)
  const DEEPGRAM_API_KEY = "14f6f72c0669b3d0d2457c4f4b27fd75eabb3414";

  const startDeepgram = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const deepgram = createClient(DEEPGRAM_API_KEY);

      const connection = deepgram.listen.live({
        model: "nova-2",
        language: language, // Uses the selected language from dropdown
        smart_format: true,
        interim_results: false,
        // encoding/sample_rate removed so browser auto-detects
        keywords: [
          "Vakalatnama:3", "Suo Moto:3", "Res Judicata:3", 
          "Affidavit:2", "Honorable Court:2", "Petitioner:2", "Respondent:2"
        ]
      });

      connectionRef.current = connection;

      connection.on(LiveTranscriptionEvents.Open, () => {
        setIsListening(true);
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        });

        mediaRecorder.start(250);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0]?.transcript;
        if (transcript && onSpeechInput) {
             onSpeechInput(transcript); 
        }
      });

     // Inside startDeepgram function...

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0]?.transcript;
        
        // 🛑 FIX: "data.is_final" चेक करें। 
        // इसका मतलब है: जब Deepgram को यकीन हो जाए कि वाक्य पूरा हो गया है, तभी टेक्स्ट भेजो।
        if (transcript && data.is_final && onSpeechInput) {
             onSpeechInput(transcript); 
        }
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        setIsListening(false);
        connectionRef.current = null;
      });

    } catch (error) {
      console.error("Mic Access Error:", error);
      alert("Could not access microphone.");
    }
  };

  const stopDeepgram = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (connectionRef.current) {
      setTimeout(() => {
        if (connectionRef.current) {
            connectionRef.current.requestClose();
            connectionRef.current = null;
        }
        setIsListening(false);
      }, 500);
    } else {
        setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopDeepgram();
    } else {
      startDeepgram();
    }
  };

  // If user changes language while listening, restart the connection
  useEffect(() => {
    if (isListening) {
        console.log("Language changed to", language, "- Restarting Steno...");
        stopDeepgram();
        // Give it a second to close before restarting
        setTimeout(() => {
            startDeepgram();
        }, 1000);
    }
  }, [language]); 

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDeepgram();
    };
  }, []);

  return (
    <aside className="w-72 bg-white h-[calc(100vh-128px)] border-r border-gray-200 p-4 overflow-y-auto fixed left-0 top-16 z-40">
      
      {/* SPEECH INPUT CARD */}
      <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
          <span className="bg-white p-1 rounded shadow-sm text-lg">🎙️</span> Super Steno
        </h3>

        {/* --- UPDATED DROPDOWN --- */}
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 transition cursor-pointer"
        >
          {languageOptions.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
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
                Listening ({languageOptions.find(l => l.code === language)?.label})
              </p>
            </div>
        )}
      </div>

      {/* PLACEHOLDERS */}
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