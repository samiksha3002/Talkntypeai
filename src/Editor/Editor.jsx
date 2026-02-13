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

    // 1. commands list defined here
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();

    const processSpeechText = (text) => {
      let processed = text;
      
      // --- PUNCTUATION MAPPING (From your Image) ---
      const commands = [
        { phrases: ["comma", "alpviram", "swalpviram"], symbol: "," },
        { phrases: ["full stop", "purna viram", "purnaviram"], symbol: "." },
        { phrases: ["question mark", "prashnchin", "prashna chinha", "prashnvachak"], symbol: "?" },
        { phrases: ["exclamation", "vismayadibodhak", "aashcharyavachak"], symbol: "!" },
        { phrases: ["colon", "apurna viram", "apurnaviram"], symbol: ":" },
        { phrases: ["semi colon", "ardhviram"], symbol: ";" },
        { phrases: ["hyphen", "yojak chinh", "sanyog chinh"], symbol: "-" },
        { phrases: ["slash", "tirchi rekha", "tirki regh"], symbol: "/" },
        { phrases: ["open bracket", "koshak shuru", "kans suru"], symbol: "(" },
        { phrases: ["close bracket", "koshak band", "kans band"], symbol: ")" },
        { phrases: ["double quote", "dohra uddharan", "duheri avtaran"], symbol: '"' },
        { phrases: ["single quote", "ekal uddharan", "ekeri avtaran"], symbol: "'" },
        { phrases: ["at the rate", "et da ret"], symbol: "@" },
        { phrases: ["plus sign", "jama chinh", "berij chinh"], symbol: "+" },
      ];

      // Replace phrases with symbols (Case Insensitive)
      commands.forEach(({ phrases, symbol }) => {
        phrases.forEach(phrase => {
          const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
          processed = processed.replace(regex, symbol);
        });
      });
      
      return processed;
    };

    let CleanSpeech = processSpeechText(speechText);
    const lowerSpeech = speechText.toLowerCase();
    let textToInsert = " " + CleanSpeech;

if (["new paragraph", "naya paragraph", "navin pariched"].some(cmd => lowerSpeech.includes(cmd))){
  textToInsert = "\n\n";
  }else if ([
    "new line","nai line ", "navin line "].some(cmd => lowerSpeech.includes(cmd))){
      textToInsert = "\n";
    }

   //insert at cursor 
   if (range) {
    editor.insertText(range.index,textToInsert , 'user');
    editor.setSelection(range.index + textToInsert.length , 0 );
  }
  else{
    const length = editor.getLength();
    editor.insertText(length - 1 ,textToInsert , 'user');
  }

  //sync state 

    setManualText(editor.root.innerHTML);
    lastProcessedSpeechRef.current = speechText;
     },[speechText, setManualText]);



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