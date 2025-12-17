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
  setShowDraftPopup,
  isAIGenerating,
  API_BASE_URL,
}) => {
  const ocrRef = useRef(null);
  const audioRef = useRef(null);

  // 🛠️ File handler for OCR and Audio uploads
  const handleFileSelect = (e, uploadFunction, setLoadingState) => {
    if (e.target.files && e.target.files[0]) {
      uploadFunction(e, setManualText, setLoadingState, API_BASE_URL);
      e.target.value = null; // Input reset taaki same file dubara select ho sake
    }
  };

  return (
    <div className="bg-indigo-50 border-b p-2 flex gap-2 flex-wrap">

      {/* ✨ AI Fix Grammar */}
      <AiButton
        label="✨ Fix Grammar"
        color="blue"
        onClick={() =>
          fixGrammar(manualText, setManualText, setIsTranslating, API_BASE_URL)
        }
      />

      {/* 🖼️ Image to Text (OCR) */}
      <AiButton
        label={isOCRLoading ? "⏳ Extracting..." : "🖼️ Image → Text"}
        color="purple"
        onClick={() => !isOCRLoading && ocrRef.current.click()}
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
        onClick={() => !isAudioLoading && audioRef.current.click()}
      />
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => handleFileSelect(e, uploadAudio, setIsAudioLoading)}
      />

      {/* 📝 Toggle AI Chat Window */}
      <AiButton
        label={showChat ? "❌ Close Chat" : "📝 AI Chat"}
        color="blue"
        onClick={() => setShowChat(!showChat)}
      />

      {/* ↔️ Expand Content */}
      <AiButton
        label="↔️ Expand"
        color="green"
        onClick={() =>
          expandText(manualText, setManualText, setIsTranslating, API_BASE_URL)
        }
      />

      {/* 🧠 AI Draft Generation */}
      <AiButton
        label={isAIGenerating ? "⏳ Generating..." : "🧠 Generate Draft"}
        color="purple"
        onClick={() => !isAIGenerating && setShowDraftPopup(true)}
      />

    </div>
  );
};

export default EditorActions;