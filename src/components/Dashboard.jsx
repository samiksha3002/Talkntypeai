import { restoreEditorAutosave, createEditorAutosave, bindEditorAutosaveLifecycle } from '../Editor/editorAutosave.js';
import { speechEvent } from "../Editor/speech.js";
import React, { useState, useCallback, useEffect, useRef } from "react";

// Layout Components
import DashboardNavbar from "../components/DashboardNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import FooterButtons from "./FooterButtons";

// --- NEW COMPONENT IMPORT ---
// Note: Create this file in your components folder or wherever you keep features
import LegalAIHub from "../Features/Components/LegalAIHub"; 

// --- GLOBAL LOADING SCREEN COMPONENT ---
const LoadingOverlay = ({ message }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
    <div className="bg-white/95 backdrop-blur-2xl px-10 py-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-white/60 flex flex-col items-center justify-center ring-1 ring-gray-100 animate-fade-in scale-100">
      <div className="relative w-16 h-16 mb-5">
         <div className="absolute inset-0 border-4 border-indigo-50 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
      <h3 className="text-lg font-bold text-gray-800 tracking-tight">Processing</h3>
      <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest mt-2 animate-pulse">
        {message || "PLEASE WAIT..."}
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [ownerId] = useState(user._id);
  const [initialAutosave] = useState(() => restoreEditorAutosave({ storage: () => localStorage, recoveryStorage: () => sessionStorage, ownerId }));
  const [editorContent, setEditorContent] = useState(initialAutosave.html);
  const [rootFontFamily, setRootFontFamily] = useState(initialAutosave.fontFamily);
  const [saveStatus, setSaveStatus] = useState(initialAutosave.readError ? 'read-error' : initialAutosave.recovered ? 'error' : 'idle');
  const mounted = useRef(true), autosave = useRef(null);
  if (!autosave.current) autosave.current = createEditorAutosave({
    storage: () => localStorage, recoveryStorage: () => sessionStorage, ownerId, initial: initialAutosave,
    canWrite: () => JSON.parse(localStorage.getItem('user') || '{}')._id === ownerId,
    onStatus: status => { if (mounted.current) setSaveStatus(status); },
  });
  const [speechEvents, setSpeechEvents] = useState([]);
  
  // --- ✨ STEP 3: VIEW STATE ✨ ---
  // Controls whether we see the Editor or the new Legal AI Hub
  const [activeView, setActiveView] = useState("editor"); 

  // --- COMMAND STATES ---
  const [transliterationCommand, setTransliterationCommand] = useState(null);
  const [fontConvertCommand, setFontConvertCommand] = useState(null);

  // --- LOADING STATES ---
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // --- AUTO-SAVE ---
  useEffect(() => {
    mounted.current = true;
    const unbind = bindEditorAutosaveLifecycle(autosave.current, window, document);
    return () => { mounted.current = false; unbind(); };
  }, []);

  const updateRootFont = useCallback(font => {
    autosave.current.stage(autosave.current.snapshot.html, font); setRootFontFamily(font);
  }, []);
  const flushNavigation = event => {
    if (event.target.closest('footer button, a[href]') && !autosave.current.flush()) {
      event.preventDefault(); event.stopPropagation();
      setSaveStatus(initialAutosave.readError ? 'read-error' : 'error');
    }
  };
  const downloadRecovery = () => {
    const { html, fontFamily } = autosave.current.snapshot;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, ownerId, html, fontFamily })], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'TalknType-editor-recovery.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const isGlobalLoading = isTranslating || isTransliterating || isConverting || isOCRLoading || isAudioLoading || isAIGenerating;

  const getLoadingMessage = () => {
    if (isTranslating) return "Translating text...";
    if (isTransliterating) return "Converting script...";
    if (isConverting) return "Changing fonts...";
    if (isOCRLoading) return "Extracting text from image...";
    if (isAudioLoading) return "Processing audio file...";
    if (isAIGenerating) return "AI is writing...";
    return "Working on it...";
  };

  const handleSpeechInput = useCallback((input) => {
    const event = speechEvent(input);
    if (event) setSpeechEvents(pending => [...pending, event]);
  }, []);
  const handleSpeechConsumed = useCallback((ids) => {
    const consumed = new Set(ids);
    setSpeechEvents(pending => pending.filter(event => !consumed.has(event.id)));
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
    const html = typeof newContent === 'function' ? newContent(autosave.current.snapshot.html) : newContent;
    autosave.current.stage(html); setEditorContent(html);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans relative" onClickCapture={flushNavigation}>
      
      {isGlobalLoading && <LoadingOverlay message={getLoadingMessage()} />}

      {/* ---------- NAVBAR ---------- */}
      <header className="flex-none h-16 shadow-sm z-50 bg-white border-b border-gray-200">
        <DashboardNavbar />
      </header>

      {(saveStatus === 'error' || saveStatus === 'read-error') ? <div role="alert" className="bg-amber-50 p-3 text-amber-900">
        {saveStatus === 'read-error' ? 'Saved work could not be read. Saving is paused to protect it. Download your recent work before reloading.' : 'Recent work has NOT been saved to this browser. Keep this page open, retry saving, or download a recovery copy.'}
        <button type="button" onClick={() => autosave.current.flush()} className="underline mx-3">Retry saving</button>
        <button type="button" onClick={downloadRecovery} className="underline">Download recovery copy</button>
      </div> : <div role="status" data-editor-autosave className="text-xs px-3">{saveStatus === 'saved' ? 'Saved to this browser' : saveStatus === 'pending' ? 'Unsaved changes — saving…' : 'Autosave ready'}</div>}

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ---------- SIDEBAR (Only show in Editor mode) ---------- */}
        {activeView === "editor" && (
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
        )}

        {/* ---------- DYNAMIC CONTENT AREA ---------- */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeView === "editor" ? (
            <Editor
              speechEvents={speechEvents}
              onSpeechConsumed={handleSpeechConsumed}
              manualText={editorContent}
              rootFontFamily={rootFontFamily}
              onRootFontChange={updateRootFont}
              setManualText={updateEditorContent}
              user={user}
              transliterationCommand={transliterationCommand}
              fontConvertCommand={fontConvertCommand}
              setTransliterationCommand={setTransliterationCommand}
              setFontConvertCommand={setFontConvertCommand}
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
          ) : (
            <LegalAIHub /> 
          )}
        </main>
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="flex-none h-20 bg-white border-t border-gray-200 z-50">
        {/* Passing setActiveView so footer buttons can switch views */}
        <FooterButtons setActiveView={setActiveView} activeView={activeView} />
      </footer>
    </div>
  );
};

export default Dashboard;
