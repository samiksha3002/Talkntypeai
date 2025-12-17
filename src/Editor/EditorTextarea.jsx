import AiChat from "../components/AiChat";

const EditorTextarea = ({ manualText, setManualText, showChat }) => (
  <div className="flex flex-1 overflow-hidden">
    <textarea
      value={manualText}
      onChange={e => setManualText(e.target.value)}
      className={`p-8 text-lg flex-1 resize-none outline-none ${
        showChat ? "w-2/3" : "w-full"
      }`}
      placeholder="Start typing or speaking..."
    />

    {showChat && (
      <div className="w-1/3 border-l">
        {/* Note: Ensure AiChat takes contextText prop */}
        <AiChat contextText={manualText} />
      </div>
    )}
  </div>
);

export default EditorTextarea;