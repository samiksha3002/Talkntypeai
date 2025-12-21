import React, { useState, useCallback } from "react";

// Layout Components
import DashboardNavbar from "../components/DashboardNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import FooterButtons from "./FooterButtons";

const Dashboard = () => {
  // ------------------------------------------
  // 1. MAIN EDITOR STATE (Single Source of Truth)
  // ------------------------------------------
  const [editorContent, setEditorContent] = useState("");
  const [voiceText, setVoiceText] = useState("");

  // ------------------------------------------
  // 2. COMMAND TRIGGERS (Sidebar → Editor)
  // ------------------------------------------
  const [transliterationCommand, setTransliterationCommand] = useState(null);
  const [fontConvertCommand, setFontConvertCommand] = useState(null);

  // ------------------------------------------
  // 3. LOADING STATES
  // ------------------------------------------
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // ------------------------------------------
  // HANDLERS (Sidebar → Dashboard)
  // ------------------------------------------

  // 🎙️ Speech Input
  const handleSpeechInput = useCallback((text) => {
    setVoiceText(text);
  }, []);

  // 🔁 Transliteration
  const handleTransliterateCommand = (scriptCode) => {
    const text = editorContent.trim();
    if (!text) return;

    setTransliterationCommand({
      id: Date.now(),
      script: scriptCode,
      textToTransliterate: text,
    });
  };

  // 🅰️ FONT CONVERSION (Mangal → KrutiDev / Unicode)
  const handleFontConvertCommand = (fontCode) => {
    const text = editorContent.trim();
    if (!text) return;

    setFontConvertCommand({
      id: Date.now(),
      font: fontCode,          // "krutidev" | "unicode"
      textToConvert: text,
    });
  };

  // 📝 Editor content update
  const updateEditorContent = useCallback((newContent) => {
    setEditorContent(newContent);
  }, []);

  // ------------------------------------------
  // UI
  // ------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ---------- NAVBAR ---------- */}
      <div className="flex-none h-16 shadow-sm z-50">
        <DashboardNavbar />
      </div>

      {/* ---------- MAIN ---------- */}
      <div className="flex flex-1 overflow-hidden">

        {/* ---------- SIDEBAR ---------- */}
        <aside className="flex-none w-72 border-r bg-white overflow-y-auto">
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

        {/* ---------- EDITOR ---------- */}
        <main className="flex-1 flex flex-col bg-gray-50">
          <Editor
            // Content
            speechText={voiceText}
            manualText={editorContent}
            setManualText={updateEditorContent}

            // Commands
            transliterationCommand={transliterationCommand}
            fontConvertCommand={fontConvertCommand}

            // Clear commands after execution
            setTransliterationCommand={setTransliterationCommand}
            setFontConvertCommand={setFontConvertCommand}

            // Loading state setters
            setIsTransliterating={setIsTransliterating}
            setIsConverting={setIsConverting}

            // Loading states
            isTransliterating={isTransliterating}
            isConverting={isConverting}
          />
        </main>
      </div>

      {/* ---------- FOOTER ---------- */}
      <div className="flex-none border-t bg-white z-50">
        <FooterButtons />
      </div>
    </div>
  );
};

export default Dashboard;
