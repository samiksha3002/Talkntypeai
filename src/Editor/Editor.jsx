import React, { useState, useEffect, useRef } from "react";
import EditorActions from "./EditorActions";
import EditorTextarea from "./EditorTextarea";
import EditorStatusBar from "./EditorStatusBar";
import DraftPopup from "./DraftPopup";
// Agar file ka naam fontConverter.js hai toh:

const Editor = ({
  user,
  speechText,
  manualText,
  setManualText,
  translationCommand,
  setTranslationCommand,
  transliterationCommand,
  setTransliterationCommand,
  fontConvertCommand,
  setFontConvertCommand,  
  isTranslating, setIsTranslating,
  isTransliterating, setIsTransliterating,
  isConverting, setIsConverting,
  isOCRLoading, setIsOCRLoading,
  isAudioLoading, setIsAudioLoading,
  isAIGenerating, setIsAIGenerating
}) => {
  const lastProcessedSpeechRef = useRef("");
  const quillRef = useRef(null);
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
  if (!speechText || speechText === lastProcessedSpeechRef.current || !quillRef.current) return;

  const editor = quillRef.current.getEditor();
  const range = editor.getSelection();

  // --- MERGED PROCESSOR FUNCTION ---
  const processSpeechText = (text) => {
    let processed = text;
    const commands = [
      { phrases: ["comma", "alpviram", "swalpviram"], symbol: "," },
      { phrases: ["full stop", "purna viram", "purnaviram"], symbol: "." },
      { phrases: ["question mark", "prashnchin", "prashnvachak"], symbol: "?" },
      { phrases: ["exclamation", "vismayadibodhak", "aashcharyavachak"], symbol: "!" },
      { phrases: ["colon", "apurna viram", "apurnaviram"], symbol: ":" },
      { phrases: ["at the rate", "et da ret"], symbol: "@" },
    ];

    // 1. Replace phrases with symbols
    commands.forEach(({ phrases, symbol }) => {
      phrases.forEach(phrase => {
        // \s? use karne se phrase ke aage piche ka extra space catch ho jayega
        const regex = new RegExp(`\\s?${phrase}\\s?`, 'gi');
        processed = processed.replace(regex, symbol);
      });
    });

    // 2. SMART SPACING: Punctuation se pehle ka extra space hatao (e.g. "Hello ," -> "Hello,")
    processed = processed.replace(/\s+([,.?!:;])/g, '$1');

    // 3. LEGAL FORMATTING: Talk N Type ke liye important terms capitalize karein
    const legalTerms = ["section", "article", "court", "respondent", "petitioner", "plaintiff"];
    legalTerms.forEach(term => {
      const reg = new RegExp(`\\b${term}\\b`, 'gi');
      processed = processed.replace(reg, (match) => match.charAt(0).toUpperCase() + match.slice(1));
    });

    return processed;
  };

  // 1. Diffing Logic: Sirf naya bola hua text nikaalein
  let newPart = speechText;
  if (lastProcessedSpeechRef.current && speechText.startsWith(lastProcessedSpeechRef.current)) {
    newPart = speechText.slice(lastProcessedSpeechRef.current.length);
  }

  // Naye part ko process karein
  let cleanText = processSpeechText(newPart);
  
  // 2. DUPLICATE CHECK: Agar Deepgram ne pehle hi punctuation de diya hai
  const currentIndex = range ? range.index : editor.getLength() - 1;
  const lastChar = editor.getText(currentIndex - 1, 1);

  if ((lastChar === "," && cleanText.trim().startsWith(",")) || 
      (lastChar === "." && cleanText.trim().startsWith("."))) {
    cleanText = cleanText.trim().substring(1); 
  }

  let textToInsert = cleanText;

  // 3. New Line / Paragraph Commands (Case Insensitive)
  const lowerClean = cleanText.toLowerCase();
  if (["new paragraph", "naya paragraph", "navin pariched"].some(cmd => lowerClean.includes(cmd))) {
    textToInsert = "\n\n";
  } else if (["new line", "nai line", "navin line"].some(cmd => lowerClean.includes(cmd))) {
    textToInsert = "\n";
  }

  // 4. Final Insert into Quill
  if (range) {
    editor.insertText(range.index, textToInsert, 'user');
    editor.setSelection(range.index + textToInsert.length, 0);
  } else {
    const length = editor.getLength();
    editor.insertText(length - 1, textToInsert, 'user');
  }

  // State update and Ref sync
  setManualText(editor.root.innerHTML);
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
// ─────────────────────────────────────────────────────────────────────────────
// REPLACE ONLY the Font Conversion useEffect in your Editor.js
// Find the existing useEffect that has "runFontConversion" and replace it
// with this entire block.
//
// ALSO: Remove this old import at the top of Editor.js:
//   import { convertToKrutiDev, convertToShivaji } from "../../utils/fontConverter";
// It is no longer needed — all conversions now go through the API.
// ─────────────────────────────────────────────────────────────────────────────

// 🔠 Font Conversion Effect
useEffect(() => {
    const runFontConversion = async () => {
      if (!fontConvertCommand?.textToConvert || !fontConvertCommand?.font) return;
 
      try {
        setIsConverting(true);
 
        // HTML strip karke plain text nikalo
        const plainText = fontConvertCommand.textToConvert
          .replace(/<\/p>/gi, "\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\u00A0/g, " ")
          .trim();
 
        // FontConvertCard.font = "unicode-to-krutidev" / "unicode-to-shivaji" / "unicode-to-preeti"
        const conversionType = fontConvertCommand.font;
 
        // ✅ CORRECT URL — /api/font/convert (not /api/font-convert/)
        // API_BASE_URL will be "http://localhost:5000" locally
        // and your production URL on server
        const res = await fetch(`${API_BASE_URL}/api/font/convert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: plainText, conversionType }),
        });
 
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Route not found (${res.status}). Check server.js has: app.use("/api/font", fontConvertRouter)`);
        }
 
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }
 
        setManualText(`<p>${data.convertedText}</p>`);
 
      } catch (err) {
        console.error("Font conversion error:", err.message);
        alert(`Font conversion failed:\n${err.message}`);
      } finally {
        setIsConverting(false);
        setFontConvertCommand(null);
      }
    };
 
    runFontConversion();
  }, [fontConvertCommand, API_BASE_URL, setManualText, setIsConverting, setFontConvertCommand]);
 

  // ✅ HERE IS THE FIX: clearAutoSave is defined before it's used in the return block
  const clearAutoSave = () => {
    if (user?._id) {
      localStorage.removeItem(`autosave_${user._id}`);
      setManualText('');
    }
  };

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
          quillRef = {quillRef}
        />

        {/* Text Area */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          <EditorTextarea
            manualText={manualText}
            setManualText={setManualText}
            showChat={showChat}
            quillRef={quillRef}
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