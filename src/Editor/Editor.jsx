import React, { useState, useEffect, useRef } from "react";
import EditorActions from "./EditorActions";
import EditorTextarea from "./EditorTextarea";
import EditorStatusBar from "./EditorStatusBar";
import DraftPopup from "./DraftPopup";
import FontConvertCard from "../components/Sidebar/FontConvertCard";
import { mangalToKruti } from "../../utils/mangalToKruti";

const Editor = ({
  user,
  speechText,
  manualText,
  setManualText,

  // Commands from Dashboard
  translationCommand,
  setTranslationCommand,
  transliterationCommand,
  setTransliterationCommand,
  fontConvertCommand,
  setFontConvertCommand,

  // Loading States & Setters (Passed from Dashboard for Global Screen)
  isTranslating, setIsTranslating,
  isTransliterating, setIsTransliterating,
  isConverting, setIsConverting,
  isOCRLoading, setIsOCRLoading,
  isAudioLoading, setIsAudioLoading,
  isAIGenerating, setIsAIGenerating
}) => {
  const lastProcessedSpeechRef = useRef("");
  const [showChat, setShowChat] = useState(false);
  const [showDraftPopup, setShowDraftPopup] = useState(false);

  // 🌐 API Base URL
  const [API_BASE_URL, setApiBaseUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  );

  // Load Config
  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.API_URL) setApiBaseUrl(cfg.API_URL);
      })
      .catch((err) => console.error("Failed to load config.json", err));
  }, []);

  // 🎤 Speech Append Logic
  useEffect(() => {
    if (!speechText) return;
    if (speechText === lastProcessedSpeechRef.current) return;
    
    setManualText((prev) => 
      prev ? prev + " " + speechText : `<p>${speechText}</p>`
    );
    lastProcessedSpeechRef.current = speechText;
  }, [speechText, setManualText]);

  // 🌐 Translation Effect
  useEffect(() => {
    const runTranslation = async () => {
      if (!translationCommand?.textToTranslate || !translationCommand?.lang) return;
      
      try {
        setIsTranslating(true); // Triggers Global Loading
        const plainText = translationCommand.textToTranslate.replace(/<[^>]*>/g, "");
        
        const res = await fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text: plainText, 
            targetLang: translationCommand.lang 
          }),
        });

        if (!res.ok) throw new Error("Translation Failed");
        const data = await res.json();
        
        if (data.translatedText) {
          setManualText(`<p>${data.translatedText}</p>`);
        }
      } catch (err) {
        console.error("Translation error:", err);
        alert("Translation Error. Please try again.");
      } finally {
        setIsTranslating(false); // Hides Global Loading
        setTranslationCommand(null);
      }
    };
    runTranslation();
  }, [translationCommand, API_BASE_URL, setManualText, setIsTranslating, setTranslationCommand]);

  // ✍️ Transliteration Effect
  useEffect(() => {
    const runTransliteration = async () => {
      if (!transliterationCommand) return;
      
      try {
        setIsTransliterating(true); // Triggers Global Loading
        const plainText = transliterationCommand.textToTransliterate.replace(/<[^>]*>/g, "");
        
        const res = await fetch(`${API_BASE_URL}/api/transliterate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: plainText,
            sourceLang: "hi",
            targetScript: transliterationCommand.script === "en" ? "Latn" : "Deva",
          }),
        });

        if (!res.ok) throw new Error("Transliteration Failed");
        const data = await res.json();
        
        if (data.transliteratedText) {
          setManualText(`<p>${data.transliteratedText}</p>`);
        }
      } catch (err) {
        console.error("Transliteration error:", err);
        alert("Transliteration Error. Please try again.");
      } finally {
        setIsTransliterating(false); // Hides Global Loading
        setTransliterationCommand(null);
      }
    };
    runTransliteration();
  }, [transliterationCommand, API_BASE_URL, setManualText, setIsTransliterating, setTransliterationCommand]);

  // 🔠 Font Conversion Effect
  useEffect(() => {
  const runFontConversion = async () => {
    if (!fontConvertCommand?.textToConvert || !fontConvertCommand?.font) return;

    try {
      setIsConverting(true); // show global loading

      // Small timeout so loading spinner is visible even for fast operations
      setTimeout(async () => {
        const plainText = fontConvertCommand.textToConvert.replace(/<[^>]*>/g, "");
        let convertedText = plainText;

        if (fontConvertCommand.font === "krutidev") {
          // Call backend API for KrutiDev → Unicode
        const res = await fetch(`${API_BASE_URL}/api/font-convert/krutidev-to-unicode`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: plainText })
});


          const data = await res.json();
          convertedText = data.convertedText || plainText;
        } else if (fontConvertCommand.font === "unicode") {
          // Just keep plain text for Unicode
          convertedText = plainText;
        }

        setManualText(`<p>${convertedText}</p>`);
        setIsConverting(false); // hide loading
        setFontConvertCommand(null);
      }, 500);
    } catch (err) {
      console.error("Font conversion error:", err);
      setIsConverting(false);
    }
  };

  runFontConversion();
}, [fontConvertCommand, setManualText, setIsConverting, setFontConvertCommand]);

  // Helper to clear storage (Triggered from Toolbar)
  const clearAutoSave = () => {
     if(user?._id) {
         localStorage.removeItem(`autosave_${user._id}`);
         setManualText(''); 
     }
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white relative overflow-hidden">
      
      {/* Container wrapper */}
      <div className="flex-1 border-l border-gray-200 flex flex-col overflow-hidden min-h-0">
        
        {/* Editor Toolbar - Passes Setters to Buttons */}
        <EditorActions
          manualText={manualText}
          setManualText={setManualText}
          showChat={showChat}
          setShowChat={setShowChat}
          
          setIsTranslating={setIsTranslating}
          
          isOCRLoading={isOCRLoading}
          setIsOCRLoading={setIsOCRLoading}
          
          isAudioLoading={isAudioLoading}
          setIsAudioLoading={setIsAudioLoading}
          
          setShowDraftPopup={setShowDraftPopup}
          setIsAIGenerating={setIsAIGenerating}
          
          API={API_BASE_URL}
          onClear={clearAutoSave}
        />

        {/* Text Area */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <EditorTextarea
            manualText={manualText}
            setManualText={setManualText}
            showChat={showChat}
          />
        </div>

        {/* Status Bar - Shows status indicators */}
        <EditorStatusBar
          manualText={manualText}
          speechText={speechText}
          isTranslating={isTranslating}
          isTransliterating={isTransliterating}
          isConverting={isConverting}
          isOCRLoading={isOCRLoading}
          isAudioLoading={isAudioLoading}
          isAIGenerating={isAIGenerating}
        />
      </div>

      {showDraftPopup && (
        <DraftPopup
          onClose={() => setShowDraftPopup(false)}
          setManualText={setManualText}
          setIsAIGenerating={setIsAIGenerating}
        />
      )}
    </div>
  );
};

export default Editor;