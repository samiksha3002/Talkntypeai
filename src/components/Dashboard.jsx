import React, { useState, useCallback } from 'react';

// Components
import DashboardNavbar from '../components/DashboardNavbar';
import Sidebar from '../components/Sidebar/Sidebar';
import Editor from '../Editor/Editor';  
import FooterButtons from './FooterButtons';

const Dashboard = () => {
  // ------------------------------------------
  // 1. MAIN EDITOR STATE (Single Source of Truth)
  // ------------------------------------------
  const [editorContent, setEditorContent] = useState('');
  const [voiceText, setVoiceText] = useState('');

  // ------------------------------------------
  // 2. COMMAND TRIGGERS (Fire → Editor will catch)
  // ------------------------------------------
  const [translationCommand, setTranslationCommand] = useState(null);
  const [transliterationCommand, setTransliterationCommand] = useState(null);
  const [fontConvertCommand, setFontConvertCommand] = useState(null);

  // ------------------------------------------
  // 3. LOADING STATES (UI Spinners & disable buttons)
  // ------------------------------------------
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTransliterating, setIsTransliterating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // ------------------------------------------
  // HANDLERS
  // ------------------------------------------

  // Helper function to clean up complex language codes (e.g., "mr-IN" -> "mr")
  const getCleanLangCode = (code) => {
    // Splits at '-' and takes the first part, or returns the code itself
    return code ? code.split('-')[0] : '';
  };

  // Voice input from sidebar microphone
  const handleSpeechInput = useCallback((text) => {
    setVoiceText(text);
  }, []);

  // Trigger translation action
  const handleTranslateCommand = (langCode) => {
    // 🚨 FIX 1: Robust validation for text and cleaning language code
    
    const textToTranslate = editorContent.trim();
    const cleanLangCode = getCleanLangCode(langCode);

    if (!textToTranslate) {
      console.error("Validation failed: Editor content is empty.");
      // NOTE: Error message should ideally be displayed in Sidebar/TranslationCard
      return;
    }
    if (!cleanLangCode) {
      console.error("Validation failed: Target language is missing.");
      return;
    }

    console.log("Dashboard → Translation Trigger:", { lang: cleanLangCode, text: textToTranslate });
    
    setTranslationCommand({
      // Using the cleaned language code
      lang: cleanLangCode,
      textToTranslate: textToTranslate,
      id: Date.now()
    });
  };

  // Trigger transliteration action
  const handleTransliterateCommand = (scriptCode) => {
    // Basic validation for text
    const textToTransliterate = editorContent.trim();
    if (!textToTransliterate) {
      console.error("Validation failed: Editor content is empty for transliteration.");
      return;
    }

    console.log("Dashboard → Transliteration Trigger:", scriptCode);
    setTransliterationCommand({
      script: scriptCode,
      textToTransliterate: textToTransliterate,
      id: Date.now()
    });
  };

  // Trigger FONT CONVERSION action
  const handleFontConvertCommand = (fontCode) => {
    // Basic validation for text
    const textToConvert = editorContent.trim();
    if (!textToConvert) {
      console.error("Validation failed: Editor content is empty for font conversion.");
      return;
    }
    
    console.log("Dashboard → Font Convert Trigger:", fontCode);
    setFontConvertCommand({
      font: fontCode,
      textToConvert: textToConvert,
      id: Date.now()
    });
  };

  // Editor updates content
  const updateEditorContent = useCallback((newContent) => {
    setEditorContent(newContent);
  }, []);

  return (
    <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">

      {/* -------- TOP NAVBAR -------- */}
      <div className="flex-none z-50 h-16 w-full shadow-sm">
        <DashboardNavbar />
      </div>

      {/* -------- MAIN LAYOUT WRAPPER -------- */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* -------- SIDEBAR AREA -------- */}
        <div className="flex-none w-72 h-full overflow-y-auto border-r border-gray-200 bg-white">
          <Sidebar
            onSpeechInput={handleSpeechInput}
            onTranslate={handleTranslateCommand}
            onTransliterate={handleTransliterateCommand}
            onFontConvert={handleFontConvertCommand}
            isTranslating={isTranslating}
            isTransliterating={isTransliterating}
            isConverting={isConverting}
            editorText={editorContent}   
          />
        </div>

        {/* -------- EDITOR AREA -------- */}
        <main className="flex-1 flex flex-col relative h-full bg-gray-50">
          <Editor
            // Data
            speechText={voiceText}
            manualText={editorContent}
            setManualText={updateEditorContent}

            // Command Triggers
            translationCommand={translationCommand}
            transliterationCommand={transliterationCommand}
            fontConvertCommand={fontConvertCommand}

            // 🚨 FIX 2: Passing the setter so Editor can clear the command after execution
            setTranslationCommand={setTranslationCommand} 
            setTransliterationCommand={setTransliterationCommand}
            setFontConvertCommand={setFontConvertCommand}

            // Loading Setters
            setIsTranslating={setIsTranslating}
            setIsTransliterating={setIsTransliterating}
            setIsConverting={setIsConverting}

            // Actual state values
            isTranslating={isTranslating}
            isTransliterating={isTransliterating}
            isConverting={isConverting}
          />
        </main>
      </div>

      {/* -------- FOOTER BUTTONS -------- */}
      <div className="flex-none w-full bg-white border-t border-gray-200 z-50">
        <FooterButtons />
      </div>
    </div>
  );
};

export default Dashboard;