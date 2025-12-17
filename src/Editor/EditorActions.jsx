import { useRef } from "react";
import AiButton from "./AiButton"; 
import {
  fixGrammar,
  expandText,
  uploadOCR,
  uploadAudio
} from "./editor.api"; 

const EditorActions = ({
  manualText,
  setManualText,

  showChat,
  setShowChat,

  setIsTranslating,

  isOCRLoading,
  setIsOCRLoading,

  isAudioLoading,
  setIsAudioLoading,

  // 🔴 DRAFT RELATED PROPS
  setShowDraftPopup,
  isAIGenerating,

  API_BASE_URL,
  // 💡 ADDED: Receiving setTranslationCommand prop
  setTranslationCommand, 
}) => {
  const ocrRef = useRef(null);
  const audioRef = useRef(null);

  // 🛠️ Helper to handle file selection safely
  const handleFileSelect = (e, uploadFunction, setLoadingState) => {
    if (e.target.files && e.target.files[0]) {
      uploadFunction(e, setManualText, setLoadingState, API_BASE_URL);
      e.target.value = null; // ✅ Reset value to allow re-uploading same file
    }
  };
  
  // 🌐 Example Translation Trigger (If you need a button for it)
  // NOTE: Assuming translation is triggered elsewhere (like EditorToolbar), 
  // but if you needed a button here, you'd use setTranslationCommand.
  /*
  const handleTranslate = () => {
      // Example: Translate current text to Tamil ('ta')
      if (manualText) {
          setTranslationCommand({
              textToTranslate: manualText,
              lang: 'ta' 
          });
      }
  };
  */

  return (
    <div className="bg-indigo-50 border-b p-2 flex gap-2 flex-wrap">

      {/* ✨ Fix Grammar */}
      <AiButton
        label="✨ Fix Grammar"
        color="blue"
        onClick={() =>
          fixGrammar(manualText, setManualText, setIsTranslating, API_BASE_URL)
        }
      />

      {/* 📝 AI Chat */}
      <AiButton
        label={showChat ? "❌ Close Chat" : "📝 AI Chat"}
        color="blue"
        onClick={() => setShowChat(!showChat)}
      />

      {/* 🖼️ OCR (Image to Text) */}
      <AiButton
        label={isOCRLoading ? "⏳ Extracting..." : "🖼️ Image → Text"}
        color="purple"
        // Changed isActive prop name for clarity
        onClick={() => !isOCRLoading && ocrRef.current.click()} 
        // isActive={!isOCRLoading} was passed but not used, 
        // using the ternary for label and disabling click if loading
      />

      <input
        ref={ocrRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFileSelect(e, uploadOCR, setIsOCRLoading)}
      />

      {/* 🎵 Audio to Text */}
      <AiButton
        label={isAudioLoading ? "⏳ Converting..." : "🎵 Audio → Text"}
        color="green"
        // Changed isActive prop name for clarity
        onClick={() => !isAudioLoading && audioRef.current.click()}
      />

      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => handleFileSelect(e, uploadAudio, setIsAudioLoading)}
      />

      {/* ↔️ Expand Text */}
      <AiButton
        label="↔️ Expand"
        color="green"
        onClick={() =>
          expandText(manualText, setManualText, setIsTranslating, API_BASE_URL)
        }
      />

      {/* 🧠 GENERATE DRAFT */}
      <AiButton
        label={isAIGenerating ? "⏳ Generating..." : "🧠 Generate Draft"}
        color="purple"
        // Changed isActive prop name for clarity
        onClick={() => !isAIGenerating && setShowDraftPopup(true)}
      />
      
      {/* Example Translation Button - Uncomment if needed */}
      {/*
      <AiButton
        label="🌐 Translate to Tamil"
        color="blue"
        onClick={handleTranslate}
      />
      */}
    </div>
  );
};

export default EditorActions;