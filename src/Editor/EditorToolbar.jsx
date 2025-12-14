const EditorToolbar = ({ setManualText }) => (
  <div className="flex justify-between mb-2">
    <div className="flex gap-2">
      <button className="p-2 bg-white border rounded">💾</button>
      <button className="p-2 bg-white border rounded">🖨️</button>
      <button
        onClick={() => setManualText("")}
        className="p-2 bg-red-100 text-red-600 border rounded"
      >
        🗑️
      </button>
    </div>
  </div>
);

export default EditorToolbar;
