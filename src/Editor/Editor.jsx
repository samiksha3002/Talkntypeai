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

  const [showDraftPopup, setShowDraftPopup] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  // 🌐 API Base URL
  const [API_BASE_URL, setApiBaseUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  );

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
        setIsTranslating(true);
        const plainText = translationCommand.textToTranslate.replace(/<[^>]*>/g, "");
        const res = await fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: plainText,
            targetLang: translationCommand.lang,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server responded with ${res.status}: ${errText}`);
        }

        const data = await res.json();
        if (data.translatedText) {
          setManualText(`<p>${data.translatedText}</p>`);
        }
      } catch (err) {
        console.error("Translation error:", err);
        alert(`Translation Error: ${err.message}`);
      } finally {
        setIsTranslating(false);
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
        setIsTransliterating(true);
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

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server responded with ${res.status}: ${errText}`);
        }

        const data = await res.json();
        if (data.transliteratedText) {
          setManualText(`<p>${data.transliteratedText}</p>`);
        }
      } catch (err) {
        console.error("Transliteration error:", err);
        alert(`Transliteration Error: ${err.message}`);
      } finally {
        setIsTransliterating(false);
        setTransliterationCommand(null);
      }
    };
    runTransliteration();
  }, [transliterationCommand, API_BASE_URL, setManualText, setIsTransliterating, setTransliterationCommand]);

  // 🔠 FONT CONVERSION
  useEffect(() => {
    const runFontConversion = () => {
      if (!fontConvertCommand?.textToConvert || !fontConvertCommand?.font) return;

      try {
        setIsConverting(true);
        const plainText = fontConvertCommand.textToConvert.replace(/<[^>]*>/g, "");

        if (fontConvertCommand.font === "krutidev") {
          const convertedText = mangalToKruti(plainText);
          setManualText(`<p>${convertedText}</p>`);
        } else if (fontConvertCommand.font === "unicode") {
          setManualText(`<p>${plainText}</p>`);
        }
      } catch (err) {
        console.error("Font conversion error:", err);
      } finally {
        setIsConverting(false);
        setFontConvertCommand(null);
      }
    };

    runFontConversion();
  }, [fontConvertCommand, setManualText, setIsConverting, setFontConvertCommand]);

  return (
    /* REMOVED: p-4 and bg-gray-50 to make it sit flush against sidebar and footer */
    <div className="flex-1 w-full h-full flex flex-col bg-white relative overflow-hidden">
      
      {/* Container wrapper handles the single professional border */}
      <div className="flex-1 border-l border-gray-200 flex flex-col overflow-hidden min-h-0">
        
        {/* Editor Toolbar */}
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

        {/* Text Area: This flex-1 is critical to stretch the writing area */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <EditorTextarea
            manualText={manualText}
            setManualText={setManualText}
            showChat={showChat}
          />
        </div>

        {/* Status Bar sits at the very bottom line */}
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