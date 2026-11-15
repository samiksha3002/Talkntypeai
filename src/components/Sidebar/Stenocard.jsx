import { getSpeechCredential, DEEPGRAM_ENABLED } from '../../Editor/speechCredential.js';
import { createSpeechSession } from '../../Editor/speech.js';
import React, { useState, useEffect, useRef } from 'react';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// --- LIST OF SUPPORTED LANGUAGES (Moved from Sidebar.jsx) ---
const languageOptions = [
    // Historical cloud preferences; native fallback is selected while containment is active.
    { code: 'en-IN', label: 'English (India)', provider: 'deepgram' },
    { code: 'hi', label: 'Hindi (हिंदी)', provider: 'deepgram' },
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


const StenoCard = ({ onSpeechInput }) => {
    const [isListening, setIsListening] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [speechError, setSpeechError] = useState('');
    const [language, setLanguage] = useState('en-IN');
    
    // Refs for Deepgram
    const connectionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    
    // Refs for Web Speech API
    const recognitionRef = useRef(null);
    const speechSessionRef = useRef(null);

    // --- Deepgram Start/Stop Logic (Kept as is) ---
    const startDeepgram = async () => { /* ... (Your existing startDeepgram logic) ... */
        try {
            const credential = await getSpeechCredential();
            speechSessionRef.current?.stop();
            const session = createSpeechSession('deepgram', onSpeechInput);
            speechSessionRef.current = session;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const deepgram = createClient(credential);

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
                setIsStarting(false);
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

            connection.on(LiveTranscriptionEvents.Transcript, data => session.deepgram(data));

            connection.on(LiveTranscriptionEvents.Close, () => { session.stop(); setIsListening(false); });
            connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error("Deepgram Error:", err);
                stopSteno();
            });
        } catch (error) {
            setIsStarting(false);
            console.error("Mic Access Error:", error);
            alert(error.message || "Could not access microphone.");
        }
    };

    // --- Web Speech API Start Logic (Kept as is) ---
    const startWebSpeech = () => { /* ... (Your existing startWebSpeech logic) ... */
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            setSpeechError('Browser speech is unavailable here. Try Chrome or Edge with microphone permission, or continue typing.');
            setIsStarting(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = language === 'hi' ? 'hi-IN' : language;
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (recognitionRef.current !== recognition) return;
            setIsStarting(false);
            setIsListening(true);
        };

        speechSessionRef.current?.stop();
        const session = createSpeechSession('web', onSpeechInput);
        speechSessionRef.current = session;
        recognition.onresult = (event) => {
            session.web(event);
        };

        recognition.onerror = event => {
            if (recognitionRef.current !== recognition) return;
            const messages = {
                'not-allowed': 'Microphone permission denied. Allow microphone access and try again, or continue typing.',
                'service-not-allowed': 'Browser speech is blocked by your browser settings. Continue typing or use a supported browser.',
                'language-not-supported': 'The selected language is unavailable in this browser. Choose another language or continue typing.',
                'audio-capture': 'No microphone is available. Connect one and try again, or continue typing.',
                network: 'Browser speech could not connect. Check your connection and retry, or continue typing.',
                'no-speech': 'No speech was detected. Try again when ready.',
            };
            setSpeechError(messages[event.error] || 'Browser speech stopped. Try again or continue typing.');
            setIsStarting(false);
            stopSteno(true);
        };

        recognition.onend = () => {
            session.stop();
            if (recognitionRef.current !== recognition) return;
            recognitionRef.current = null;
            setIsStarting(false);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        try { recognition.start(); }
        catch { session.stop(); recognitionRef.current = null; setIsStarting(false); setSpeechError('Browser speech could not start. Try again or continue typing.'); }
    };

    // --- Combined Stop Logic (Kept as is) ---
    const stopSteno = (discardPending = false) => {
        if (discardPending) speechSessionRef.current?.stop();
        const recorder = mediaRecorderRef.current;
        const connection = connectionRef.current;
        if (recorder && recorder.state !== 'inactive') {
            // MediaRecorder emits its last dataavailable before the stop event.
            recorder.addEventListener('stop', () => connection?.requestClose(), { once: true });
            recorder.stop();
        } else {
            connection?.requestClose();
        }
        streamRef.current?.getTracks().forEach(track => track.stop());
        connectionRef.current = null;
        // Native stop may still emit a final result; onend retires its session.
        try { recognitionRef.current?.stop(); } catch { /* Recognition may already have ended. */ }
        recognitionRef.current = null;
        setIsListening(false);
        setIsStarting(false);
    };

    // --- Provider selection with native fallback during containment ---
    const toggleListening = () => {
        if (isStarting) return;
        setSpeechError('');
        if (isListening) {
            stopSteno();
        } else {
            const selectedOption = languageOptions.find(opt => opt.code === language);
            const provider = selectedOption ? selectedOption.provider : 'web';

            setIsStarting(true);
            if (provider === 'deepgram' && DEEPGRAM_ENABLED) {
                startDeepgram();
            } else {
                startWebSpeech();
            }
        }
    };

    // The language selector is locked while starting/listening; retire on unmount.
    const stopRef = useRef(stopSteno);
    stopRef.current = stopSteno;
    useEffect(() => () => stopRef.current(true), []);

    const currentProvider = DEEPGRAM_ENABLED && languageOptions.find(opt => opt.code === language)?.provider === 'deepgram' ? 'Deepgram' : 'Browser';

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
                disabled={isListening || isStarting}
            >
                {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
            
            <button 
                onClick={toggleListening}
                disabled={isStarting}
                className={`w-full py-2.5 rounded font-medium flex items-center justify-center gap-2 transition shadow-sm text-white ${
                    isListening ? 'bg-red-500 animate-pulse hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
            >
                <span>{isListening ? '⏹️' : '🎙️'}</span> 
                {isStarting ? 'Starting...' : isListening ? 'Stop Speaking' : 'Start Speaking'}
            </button>
            
            {!DEEPGRAM_ENABLED && <p role="status" className="text-xs mt-2">Using browser speech for the selected language. Deepgram remains paused for security maintenance.</p>}
            {speechError && <p role="alert" className="text-xs mt-2">{speechError}</p>}
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