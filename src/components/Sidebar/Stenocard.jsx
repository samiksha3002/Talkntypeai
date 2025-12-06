import React, { useState, useEffect, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// --- LIST OF SUPPORTED LANGUAGES (Moved from Sidebar.jsx) ---
const languageOptions = [
    // Deepgram Languages (Preferred STT)
    { code: 'en-IN', label: 'English (India) ⚡', provider: 'deepgram' },
    { code: 'hi', label: 'Hindi (हिंदी) ⚡', provider: 'deepgram' },
    // Web Speech API Languages (STT Fallback)
    { code: 'mr-IN', label: 'Marathi (मराठी) 🌐', provider: 'web' },
    { code: 'gu-IN', label: 'Gujarati (ગુજરાતી) 🌐', provider: 'web' },
    { code: 'ta-IN', label: 'Tamil (தமிழ்) 🌐', provider: 'web' },
    { code: 'te-IN', label: 'Telugu (తెలుగు) 🌐', provider: 'web' },
    { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ) 🌐', provider: 'web' },
    { code: 'ml-IN', label: 'Malayalam (മലയാളം) 🌐', provider: 'web' },
    { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ) 🌐', provider: 'web' },
    { code: 'bn-IN', label: 'Bengali (বাংলা) 🌐', provider: 'web' },
];

// ⚠️ PASTE YOUR DEEPGRAM API KEY HERE
const DEEPGRAM_API_KEY = "14f6f72c0669b3d0d2457c4f4b27fd75eabb3414"; 

const StenoCard = ({ onSpeechInput }) => {
    const [isListening, setIsListening] = useState(false);
    const [language, setLanguage] = useState('en-IN');
    
    // Refs for Deepgram
    const connectionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    
    // Refs for Web Speech API
    const recognitionRef = useRef(null);

    // --- Deepgram Start/Stop Logic (Kept as is) ---
    const startDeepgram = async () => { /* ... (Your existing startDeepgram logic) ... */
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const deepgram = createClient(DEEPGRAM_API_KEY);

            const connection = deepgram.listen.live({
                model: "nova-2",
                language: language,
                smart_format: true,
                interim_results: false, 
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

            connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error("Deepgram Error:", err);
                stopSteno();
            });
        } catch (error) {
            console.error("Mic Access Error:", error);
            alert("Could not access microphone.");
        }
    };

    // --- Web Speech API Start Logic (Kept as is) ---
    const startWebSpeech = () => { /* ... (Your existing startWebSpeech logic) ... */
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("Your browser does not support Web Speech API. Please use Chrome or Edge.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            if (onSpeechInput) {
                onSpeechInput(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Web Speech Error:", event.error);
            if(event.error === 'not-allowed') {
                alert("Microphone permission denied.");
                stopSteno();
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // --- Combined Stop Logic (Kept as is) ---
    const stopSteno = () => { /* ... (Your existing stopSteno logic) ... */
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (connectionRef.current) {
            connectionRef.current.requestClose();
            connectionRef.current = null;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        setIsListening(false);
    };

    // --- Hybrid Router (Kept as is) ---
    const toggleListening = () => {
        if (isListening) {
            stopSteno();
        } else {
            const selectedOption = languageOptions.find(opt => opt.code === language);
            const provider = selectedOption ? selectedOption.provider : 'web';

            if (provider === 'deepgram') {
                startDeepgram();
            } else {
                startWebSpeech();
            }
        }
    };

    // Auto-restart if Steno language changes and Cleanup (Kept as is)
    useEffect(() => {
        if (isListening) {
            stopSteno();
            setTimeout(() => toggleListening(), 1000); 
        }
    }, [language]); 

    useEffect(() => {
        return () => stopSteno();
    }, []);

    const currentProvider = languageOptions.find(opt => opt.code === language)?.provider === 'deepgram' ? 'Deepgram ⚡' : 'Browser 🌐';

    return (
        // --- CARD 1: SUPER STENO (INPUT) ---
        <div className="bg-sky-50 rounded-lg p-3 mb-4 border border-sky-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <span className="bg-white p-1 rounded shadow-sm text-lg">🎙️</span> Speak
            </h3>

            <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 transition cursor-pointer"
                disabled={isListening}
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
                {isListening ? 'Stop Speaking' : 'Start Speaking'}
            </button>
            
            {isListening && (
                <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-xs text-green-700 font-bold">
                        Listening via {currentProvider}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StenoCard;