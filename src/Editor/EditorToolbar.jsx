import React, { useState, useEffect, useRef } from "react";
import EditorActions from "./EditorActions";
import EditorTextarea from "./EditorTextarea";
import EditorStatusBar from "./EditorStatusBar";
import DraftPopup from "./DraftPopup";

// 🔠 FONT CONVERTER
import { mangalToKruti } from "../../utils/mangalToKruti";

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

  // Commands from Dashboard/Sidebar
  translationCommand,
  setTranslationCommand,
  transliterationCommand,
  setTransliterationCommand,
  fontConvertCommand,
  setFontConvertCommand,
}) => {
  const lastProcessedSpeechRef = useRef("");

  const [showChat, setShowChat] = useState(false);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // 🟣 Draft states
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // 🌐 API Base URL (runtime + fallback)
  const [API_BASE_URL, setApiBaseUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  );

  // Load runtime config.json if available
  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.API_URL) {
          setApiBaseUrl(cfg.API_URL);
          console.log("Runtime API URL loaded:", cfg.API_URL);
        }
      })
      .catch((err) => console.error("Failed to load config.json", err));
  }, []);

  // 🎤 Speech append
  useEffect(() => {
    if (!speechText) return;
    if (speechText === lastProcessedSpeechRef.current) return;

    setManualText((prev) => (prev ? prev + " " + speechText : speechText));
    lastProcessedSpeechRef.current = speechText;
  }, [speechText, setManualText]);

  // 🌐 Translation Effect
  useEffect(() => {
    const runTranslation = async () => {
      if (!translationCommand?.textToTranslate || !translationCommand?.lang) return;

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

        const data = await res.json();
        if (data.translatedText) setManualText(data.translatedText);
      } catch (err) {
        console.error("Translation error:", err.message);
      } finally {
        setIsTranslating(false);
        setTranslationCommand(null);
      }
    };
    runTranslation();
  }, [translationCommand, API_BASE_URL]);

  // ✍️ Transliteration Effect
  useEffect(() => {
    const runTransliteration = async () => {
      if (!transliterationCommand) return;

      try {
        setIsTransliterating(true);
        const res = await fetch(`${API_BASE_URL}/api/transliterate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: transliterationCommand.textToTransliterate,
            sourceLang: "hi",
            targetLang: transliterationCommand.script,
          }),
        });

        const data = await res.json();
        if (data.transliteratedText) setManualText(data.transliteratedText);
      } catch (err) {
        console.error("Transliteration error:", err.message);
      } finally {
        setIsTransliterating(false);
        setTransliterationCommand(null);
      }
    };
    runTransliteration();
  }, [transliterationCommand, API_BASE_URL]);

  // 🔠 FONT CONVERSION (MANGAL → KRUTIDEV / UNICODE)
  useEffect(() => {
    const runFontConversion = () => {
      if (!fontConvertCommand?.textToConvert || !fontConvertCommand?.font) return;

      try {
        setIsConverting(true);

        if (fontConvertCommand.font === "krutidev") {
          const convertedText = mangalToKruti(fontConvertCommand.textToConvert);
          setManualText(convertedText);
        } else if (fontConvertCommand.font === "unicode") {
          setManualText(fontConvertCommand.textToConvert);
        }
      } catch (err) {
        console.error("Font conversion error:", err.message);
      } finally {
        setIsConverting(false);
        setFontConvertCommand(null);
      }
    };

    runFontConversion();
  }, [fontConvertCommand, setManualText, setIsConverting, setFontConvertCommand]);

  return (
    <div className="flex-1 w-full h-full p-4 flex flex-col bg-gray-50 relative">
      {/* FIXED: 
        1. Added 'border-2 border-gray-200' to clearly define the box limits.
        2. Added 'mb-4' (margin bottom) so the box ends BEFORE the bottom navigation bar.
        3. Removed 'overflow-hidden' if the status bar needs to show shadows, or kept it for clean edges.
      */}
      <div className="flex-1 bg-white rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden flex flex-col mb-4">
        
        {/* Top Actions: AI Tools and Integrated Toolbar (Save, Print, etc.) */}
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
        />

        {/* Textarea Container with its own flex growth */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <EditorTextarea
            manualText={manualText}
            setManualText={setManualText}
            showChat={showChat}
          />
        </div>

        {/* Status Bar: Defined as the bottom cap of the box */}
        <EditorStatusBar
          manualText={manualText}
          speechText={speechText}
          isTranslating={isTranslating}
          isTransliterating={isTransliterating}
          isConverting={isConverting}
          isOCRLoading={isOCRLoading}
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