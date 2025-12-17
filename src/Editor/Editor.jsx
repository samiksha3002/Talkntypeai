import React, { useState, useEffect, useRef } from "react";
import EditorToolbar from "./EditorToolbar";
import EditorActions from "./EditorActions";
import EditorTextarea from "./EditorTextarea";
import EditorStatusBar from "./EditorStatusBar";
import DraftPopup from "./DraftPopup";

// src/components/Editor.jsx
const API_BASE_URL = 
  // Note: Corrected environment variable access structure
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const Editor = ({
  speechText,
  manualText,
  setManualText,
  setIsTranslating,
  setIsTransliterating,
  setIsConverting,
  isTranslating,
  isTransliterating,
  isConverting,
  // 💡 ADDED: translationCommand props from Dashboard
  translationCommand,
  setTranslationCommand,
  // NOTE: You'll also need to add transliteration and font conversion setters here
  // setTransliterationCommand, setFontConvertCommand, if you want to clear those commands
}) => {
  const lastProcessedSpeechRef = useRef("");

  const [showChat, setShowChat] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // 🟣 Draft states
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // 🎤 Speech append
  useEffect(() => {
    if (!speechText) return;
    if (speechText === lastProcessedSpeechRef.current) return;

    setManualText(prev =>
      prev ? prev + " " + speechText : speechText
    );

    lastProcessedSpeechRef.current = speechText;
  }, [speechText, setManualText]); 

  // 🌐 Translation Effect (Fix applied here)
  useEffect(() => {
    const runTranslation = async () => {
      // 🚨 FIX: Implement robust validation to avoid 400 Bad Request
      if (
        !translationCommand || 
        !translationCommand.textToTranslate || 
        !translationCommand.lang
      ) {
        // If data is missing (which caused the 400), simply stop the function.
        return;
      }
      
      // 💡 DEBUGGING LOG: Confirm the data being sent to the backend
      console.log("Sending to backend:", {
          text: translationCommand.textToTranslate,
          targetLang: translationCommand.lang,
      });

      try {
        setIsTranslating(true);

        const res = await fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: translationCommand.textToTranslate,
            targetLang: translationCommand.lang,
          }),
        });
        
        // Handle non-200 responses gracefully
        if (!res.ok) {
            // Read the error response if the server sent one (like the 400 response)
            const errorData = await res.json();
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.translatedText) {
          setManualText(data.translatedText);
        } else {
          // This path is for when the API returns 200 but the translation fails internally
          console.error("Translation failed:", data.error);
        }
      } catch (err) {
        // This catches network errors AND the custom error thrown for 400/other status codes
        console.error("Translation error:", err.message);
      } finally {
        setIsTranslating(false);
        // Reset the command only if the setter exists
        if (setTranslationCommand) {
             setTranslationCommand(null);
        }
      }
    };

    runTranslation();
  }, [translationCommand, setIsTranslating, setManualText, setTranslationCommand]); 

  return (
    <div className="flex-1 w-full h-full p-4 flex flex-col bg-gray-50 relative">

      <EditorToolbar setManualText={setManualText} />

      <div className="flex-1 bg-white rounded-xl border shadow-lg overflow-hidden flex flex-col">

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
          API_BASE_URL={API_BASE_URL}
          // Passing the setter is crucial for clearing commands from EditorActions if needed
          setTranslationCommand={setTranslationCommand} 
        />

        <EditorTextarea
          manualText={manualText}
          setManualText={setManualText}
          showChat={showChat}
        />

        <EditorStatusBar
          manualText={manualText}
          speechText={speechText}
          isTranslating={isTranslating}
          isTransliterating={isTransliterating}
          isConverting={isConverting}
          isOCRLoading={isOCRLoading}
        />
      </div>

      {/* 🧠 AI Draft Popup */}
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