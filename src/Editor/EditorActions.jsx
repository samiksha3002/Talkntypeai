import { useRef } from "react";
import AiButton from "./AiButton"; // Make sure path correct ho
import {
  fixGrammar,
  expandText,
  uploadOCR,
  uploadAudio
} from "./editor.api"; // Make sure ye file exist karti ho

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

  API_BASE_URL
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
        isActive={!isOCRLoading}
        onClick={() => ocrRef.current.click()}
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
        isActive={!isAudioLoading}
        onClick={() => audioRef.current.click()}
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
        isActive={!isAIGenerating}
        onClick={() => setShowDraftPopup(true)}
      />

    </div>
  );
};

export default EditorActions;