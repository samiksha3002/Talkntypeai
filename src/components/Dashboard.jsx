import React, { useState, useCallback, useEffect } from "react";

// Layout Components
import DashboardNavbar from "../components/DashboardNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import FooterButtons from "./FooterButtons";

// --- GLOBAL LOADING SCREEN COMPONENT ---
// --- ✨ NEW: PREMIUM PROCESSING LOADER ---
const LoadingOverlay = ({ message }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
    
    <div className="bg-white/95 backdrop-blur-2xl px-10 py-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-white/60 flex flex-col items-center justify-center ring-1 ring-gray-100 animate-fade-in scale-100">
      
      {/* --- PREMIUM ICON START --- */}
      <div className="relative w-16 h-16 mb-5">
         {/* 1. Static Light Background Ring */}
         <div className="absolute inset-0 border-4 border-indigo-50 rounded-full"></div>
         
         {/* 2. Spinning Active Ring (Gradient style with border-t) */}
         <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
         
         {/* 3. Center Icon (Thunder/AI Symbol) */}
         <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-7 h-7 text-indigo-600 drop-shadow-sm animate-pulse" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
         </div>
      </div>
      {/* --- PREMIUM ICON END --- */}

      <h3 className="text-lg font-bold text-gray-800 tracking-tight">Processing</h3>
      <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest mt-2 animate-pulse">
        {message || "PLEASE WAIT..."}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const [editorContent, setEditorContent] = useState("");
  const [voiceText, setVoiceText] = useState("");
  
  // --- COMMAND STATES ---
  const [transliterationCommand, setTransliterationCommand] = useState(null);
  const [fontConvertCommand, setFontConvertCommand] = useState(null);

  // --- LOADING STATES (Lifted Up for Global Screen) ---
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  // New States lifted from Editor
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // --- 1. GET USER (To make save unique for each person) ---
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // --- 2. AUTO-LOAD (Load saved data on startup) ---
  useEffect(() => {
    if (user._id) {
      const savedData = localStorage.getItem(`autosave_${user._id}`);
      if (savedData) {
        setEditorContent(savedData);
        // console.log("✅ Auto-saved data loaded!");
      }
    }
  }, []); // Run only once

  // --- 3. AUTO-SAVE (Save data every 1 second) ---
  useEffect(() => {
    if (user._id && editorContent) {
      const timer = setTimeout(() => {
        localStorage.setItem(`autosave_${user._id}`, editorContent);
      }, 1000); 
      return () => clearTimeout(timer);
    }
  }, [editorContent]); 

  // --- DETERMINE IF LOADING SCREEN SHOULD SHOW ---
  const isGlobalLoading = isTranslating || isTransliterating || isConverting || isOCRLoading || isAudioLoading || isAIGenerating;

  // Helper to get specific message
  const getLoadingMessage = () => {
    if (isTranslating) return "Translating text...";
    if (isTransliterating) return "Converting script...";
    if (isConverting) return "Changing fonts...";
    if (isOCRLoading) return "Extracting text from image...";
    if (isAudioLoading) return "Processing audio file...";
    if (isAIGenerating) return "AI is writing...";
    return "Working on it...";
  };

  const handleSpeechInput = useCallback((text) => {
    setVoiceText(text);
  }, []);

  const handleTransliterateCommand = (scriptCode) => {
    const text = editorContent.trim();
    if (!text) return;
    setTransliterationCommand({
      id: Date.now(),
      script: scriptCode,
      textToTransliterate: text,
    });
  };

  const handleFontConvertCommand = (fontCode) => {
    const text = editorContent.trim();
    if (!text) return;
    setFontConvertCommand({
      id: Date.now(),
      font: fontCode,
      textToConvert: text,
    });
  };

  const updateEditorContent = useCallback((newContent) => {
    setEditorContent(newContent);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans relative">
      
      {/* 🔥 GLOBAL LOADING OVERLAY 🔥 */}
      {isGlobalLoading && <LoadingOverlay message={getLoadingMessage()} />}

      {/* ---------- NAVBAR ---------- */}
      <header className="flex-none h-16 shadow-sm z-50 bg-white border-b border-gray-200">
        <DashboardNavbar />
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ---------- SIDEBAR ---------- */}
        <aside className="flex-none w-72 border-r border-gray-200 bg-white overflow-y-auto">
          <Sidebar
            onSpeechInput={handleSpeechInput}
            onTransliterate={handleTransliterateCommand}
            onFontConvert={handleFontConvertCommand}
            isTransliterating={isTransliterating}
            isConverting={isConverting}
            editorText={editorContent}
            setManualText={updateEditorContent} 
          />
        </aside>

        {/* ---------- EDITOR AREA ---------- */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <Editor
            // Data
            speechText={voiceText}
            manualText={editorContent}
            setManualText={updateEditorContent}
            user={user}

            // Commands
            transliterationCommand={transliterationCommand}
            fontConvertCommand={fontConvertCommand}
            setTransliterationCommand={setTransliterationCommand}
            setFontConvertCommand={setFontConvertCommand}

            // Loading States & Setters (Passing ALL of them)
            isTranslating={isTranslating}
            setIsTranslating={setIsTranslating}
            
            isTransliterating={isTransliterating}
            setIsTransliterating={setIsTransliterating}
            
            isConverting={isConverting}
            setIsConverting={setIsConverting}

            isOCRLoading={isOCRLoading}
            setIsOCRLoading={setIsOCRLoading}

            isAudioLoading={isAudioLoading}
            setIsAudioLoading={setIsAudioLoading}

            isAIGenerating={isAIGenerating}
            setIsAIGenerating={setIsAIGenerating}
          />
        </main>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="flex-none h-20 bg-white border-t border-gray-200 z-50">
        <FooterButtons />
      </footer>
    </div>
  );
};

export default Dashboard;