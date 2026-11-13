import { insertSpeech } from './speech.js';
import { convertEditorFont, requestFontConversion } from './fontConversion.js';
  import React, { useState, useEffect, useRef } from "react";
  import EditorActions from "./EditorActions";
  import EditorTextarea from "./EditorTextarea";
  import EditorStatusBar from "./EditorStatusBar";
  import DraftPopup from "./DraftPopup";
  import DocumentScanner from './DocumentScanner';
  // Agar file ka naam fontConverter.js hai toh:

  const Editor = ({
    user,
    speechEvents,
    onSpeechConsumed,
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
    const processedSpeechRef = useRef(new Set());
    const lastSelectionRef = useRef(null);
    const quillRef = useRef(null);
    const [showChat, setShowChat] = useState(false);
    const [showDraftPopup, setShowDraftPopup] = useState(false);
    const [scannerFile, setScannerFile] = useState(null);
    

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
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const rememberSelection = range => { if (range) lastSelectionRef.current = { ...range }; };
    editor.on('selection-change', rememberSelection);
    return () => editor.off('selection-change', rememberSelection);
  }, []);
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor || !speechEvents?.length) return;
    const consumed = [];
    for (const event of speechEvents) {
      if (!processedSpeechRef.current.has(event.id)) {
        const range = insertSpeech(editor, event, lastSelectionRef.current);
        if (range) lastSelectionRef.current = range;
        processedSpeechRef.current.add(event.id);
      }
      consumed.push(event.id);
    }
    setManualText(editor.root.innerHTML);
    onSpeechConsumed(consumed);
  }, [speechEvents, onSpeechConsumed, setManualText]);

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

    // H3: whitespace-safe, atomic Delta conversion.
useEffect(() => {
  if (!fontConvertCommand?.font || !quillRef.current) return;
  let active = true;
  const controller = new AbortController();
  const editor = quillRef.current.getEditor();
  setIsConverting(true);
  convertEditorFont(editor, fontConvertCommand.font,
    (text, type) => requestFontConversion(API_BASE_URL, text, type, { signal: controller.signal }),
    { isCurrent: () => active, fallbackRange: lastSelectionRef.current })
    .then(applied => { if (applied && active) {
      lastSelectionRef.current = editor.getSelection() || lastSelectionRef.current;
      setManualText(editor.root.innerHTML);
    } })
    .catch(error => { if (active) alert('Font conversion failed: ' + error.message); })
    .finally(() => { if (active) { setIsConverting(false); setFontConvertCommand(null); } });
  return () => { active = false; controller.abort(); };
}, [fontConvertCommand, API_BASE_URL, setManualText, setIsConverting, setFontConvertCommand]);

    // ✅ HERE IS THE FIX: clearAutoSave is defined before it's used in the return block
    const clearAutoSave = () => {
      if (user?._id) {
        localStorage.removeItem(`autosave_${user._id}`);
        setManualText('');
      }
    };

const handleInsertScannedText = (scannedText) => {
  if (typeof scannedText !== "string" || !scannedText.trim()) {
    console.warn("No scanned text received.");
    return;
  }

  const editor = quillRef.current?.getEditor?.();

  if (!editor) {
    console.error("Quill editor is not available.");
    return;
  }

  // Insert scanned text at the cursor, or at the end.
  const range = editor.getSelection(true);
  const index = range
    ? range.index
    : editor.getLength() - 1;

  const text = scannedText.trim();
  const previousChar =
    index > 0 ? editor.getText(index - 1, 1) : "";

  const textToInsert =
    previousChar &&
    !/\s/.test(previousChar) &&
    !/^[.,!?;:)\]}]/.test(text)
      ? ` ${text}`
      : text;

  editor.insertText(index, textToInsert, "user");

  // Move cursor after inserted text.
  editor.setSelection(index + textToInsert.length, 0, "user");

  // Sync React state with the editor.
  setManualText(editor.root.innerHTML);
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
            onOpenScanner={(file) => setScannerFile(file)}
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
            speechText={speechEvents?.length ? "receiving" : ""}
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
        {scannerFile && (
          <DocumentScanner 
            file={scannerFile} 
            onClose={() => setScannerFile(null)}
            onInsertText={handleInsertScannedText}
          />
        )}
      </div>
    );
  };

  export default Editor;