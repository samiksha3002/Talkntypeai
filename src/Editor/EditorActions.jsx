import React, { useState, useRef } from "react"; // Added useState
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
  API,
}) => {
  const ocrRef = useRef(null);
  const audioRef = useRef(null);
  const [showCommands, setShowCommands] = useState(false); // Local state for the modal

  const COMMANDS = [
    { symbol: ",", en: "comma", hi: "अल्पविराम", mr: "स्वल्पविराम" },
    { symbol: ".", en: "full stop", hi: "पूर्ण विराम", mr: "पूर्णविराम" },
    { symbol: "!", en: "exclamation", hi: "विस्मयादिबोधक", mr: "आश्चर्यवाचक" },
    { symbol: "?", en: "question mark", hi: "प्रश्नवाचक", mr: "प्रश्नचिन्ह" },
  ];

  const handleFileSelect = async (e, uploadFunction, setLoadingState) => {
    if (e.target.files && e.target.files[0]) {
      try {
        await uploadFunction(e, setManualText, setLoadingState, API);
      } catch (err) {
        console.error("File upload error:", err);
        alert("Failed to process file");
      } finally {
        e.target.value = null;
      }
    }
  };

  return (
    <div className="bg-indigo-50 border-b p-2 flex items-center justify-between flex-wrap gap-2">
      
      {/* --- Left Side: AI Tools --- */}
      <div className="flex gap-2 flex-wrap">
        <AiButton
          label="✨ Fix Grammar"
          color="blue"
          onClick={() => fixGrammar(manualText, setManualText, setIsTranslating, API)}
        />

        <AiButton
          label={isOCRLoading ? "⏳ Extracting..." : "🖼️ Image → Text"}
          color="purple"
          onClick={() => !isOCRLoading && ocrRef.current.click()}
        />
        <input ref={ocrRef} type="file" accept="image/*" hidden onChange={(e) => handleFileSelect(e, uploadOCR, setIsOCRLoading)} />

        <AiButton
          label={isAudioLoading ? "⏳ Converting..." : "🎵 Audio → Text"}
          color="green"
          onClick={() => !isAudioLoading && audioRef.current.click()}
        />
        <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => handleFileSelect(e, uploadAudio, setIsAudioLoading)} />

        <AiButton
          label={showChat ? "❌ Close Chat" : "📝 AI Chat"}
          color="blue"
          onClick={() => setShowChat(!showChat)}
        />

        <AiButton
          label="↔️ Expand"
          color="green"
          onClick={() => expandText(manualText, setManualText, setIsTranslating, API)}
        />

        <AiButton
          label={isAIGenerating ? "⏳ Generating..." : "🧠 Generate Draft"}
          color="purple"
          disabled={isAIGenerating}
          onClick={() => !isAIGenerating && setShowDraftPopup(true)}
        />
      </div>

      {/* --- Right Side: Toolbar Actions (Integrated) --- */}
      <div className="flex gap-2 ml-auto border-l pl-2 border-indigo-200">
        <button className="p-1.5 bg-white border rounded hover:bg-gray-50 transition" title="Save">💾</button>
        <button className="p-1.5 bg-white border rounded hover:bg-gray-50 transition" title="Print">🖨️</button>
        
        <button
          onClick={() => setShowCommands(true)}
          className="px-2 py-1.5 bg-indigo-100 text-indigo-600 border border-indigo-200 rounded text-xs font-bold hover:bg-indigo-200 transition"
        >
          🎙️
        </button>
        
        <button
          onClick={() => setManualText("")}
          className="px-2 py-1.5 bg-red-100 text-red-600 border border-red-200 rounded text-xs font-bold hover:bg-red-200 transition"
        >
          🗑️
        </button>
      </div>

      {/* Commands Modal */}
      {showCommands && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white w-[500px] rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🎙️ Voice Commands</h2>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">English</th>
                  <th className="border p-2">Hindi</th>
                  <th className="border p-2">Marathi</th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map((cmd, i) => (
                  <tr key={i}>
                    <td className="border p-2 text-center">{cmd.symbol}</td>
                    <td className="border p-2">{cmd.en}</td>
                    <td className="border p-2">{cmd.hi}</td>
                    <td className="border p-2">{cmd.mr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowCommands(false)} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorActions;