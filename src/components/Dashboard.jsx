import React, { useState, useCallback } from "react";

// Layout Components
import DashboardNavbar from "../components/DashboardNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Editor from "../Editor/Editor";
import FooterButtons from "./FooterButtons";

const Dashboard = () => {
  const [editorContent, setEditorContent] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [transliterationCommand, setTransliterationCommand] = useState(null);
  const [fontConvertCommand, setFontConvertCommand] = useState(null);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

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
    /* h-screen + overflow-hidden ensures the container is exactly the size of the viewport */
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      
      {/* ---------- NAVBAR (Fixed Height) ---------- */}
      <header className="flex-none h-16 shadow-sm z-50 bg-white border-b border-gray-200">
        <DashboardNavbar />
      </header>

      {/* ---------- MAIN CONTENT AREA ---------- */}
      {/* This section grows to fill the space between Header and Footer */}
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
        {/* We removed ALL padding and gray backgrounds to let the Editor sit flush */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden">
          <Editor
            speechText={voiceText}
            manualText={editorContent}
            setManualText={updateEditorContent}
            transliterationCommand={transliterationCommand}
            fontConvertCommand={fontConvertCommand}
            setTransliterationCommand={setTransliterationCommand}
            setFontConvertCommand={setFontConvertCommand}
            setIsTransliterating={setIsTransliterating}
            setIsConverting={setIsConverting}
            isTransliterating={isTransliterating}
            isConverting={isConverting}
          />
        </main>
      </div>

      {/* ---------- FOOTER (Fixed at Bottom) ---------- */}
      <footer className="flex-none h-20 bg-white border-t border-gray-200 z-50">
        <FooterButtons />
      </footer>
    </div>
  );
};

export default Dashboard;