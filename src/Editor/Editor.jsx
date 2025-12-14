import React, { useState, useEffect, useRef } from "react";
import EditorToolbar from "./EditorToolbar";
import EditorActions from "./EditorActions";
import EditorTextarea from "./EditorTextarea";
import EditorStatusBar from "./EditorStatusBar";
import DraftPopup from "./DraftPopup";

const API_BASE_URL =
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
  isConverting
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
  }, [speechText]);

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
