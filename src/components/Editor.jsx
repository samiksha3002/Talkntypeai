import React, { useState, useEffect, useRef } from 'react';

const Editor = ({ speechText }) => {
  const [manualText, setManualText] = useState('');
  const lastSpeechRef = useRef(''); 
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // --- 1. HANDLE SPEECH INPUT ---
  useEffect(() => {
    // Logic: Only append if text is new and not empty
    if (speechText && speechText !== lastSpeechRef.current) {
      setManualText((prev) => (prev ? prev + ' ' + speechText : speechText));
      lastSpeechRef.current = speechText;
    }
  }, [speechText]); // Run whenever speechText changes

  const handleChange = (e) => {
    setManualText(e.target.value);
  };

  const handleAiAction = (action) => {
      alert(`AI Feature '${action}' coming soon in Phase 2!`);
  };

  return (
    <div className="flex-1 w-full h-full p-4 flex flex-col overflow-hidden bg-gray-50">
      
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-2 flex-none">
        <h2 className="text-xl font-bold text-indigo-900">📄 Legal Draft</h2>
        <div className="flex gap-2">
            <button className="p-2 bg-white border rounded shadow-sm">💾</button>
            <button className="p-2 bg-white border rounded shadow-sm">🖨️</button>
            <button 
                onClick={() => setManualText('')} 
                className="p-2 bg-red-100 text-red-600 border border-red-200 rounded shadow-sm"
            >🗑️</button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-indigo-100 flex flex-col shadow-lg overflow-hidden relative">
        
        {/* AI Toolbar */}
        <div className="bg-indigo-50 border-b border-indigo-100 p-2 flex items-center gap-2">
           <span className="text-xs font-bold text-indigo-400 uppercase">AI Tools:</span>
           <AiButton onClick={() => handleAiAction('grammar')} label="✨ Fix Grammar" color="blue" />
           <AiButton onClick={() => handleAiAction('tone')} label="⚖️ Legal Tone" color="purple" />
           <AiButton onClick={() => handleAiAction('expand')} label="↔️ Expand" color="green" />
        </div>

        {/* TEXT AREA */}
        <textarea 
          value={manualText}
          onChange={handleChange}
          className="flex-1 w-full p-8 outline-none resize-none text-gray-800 font-sans text-lg leading-relaxed"
          placeholder="Start speaking via the Sidebar or type here..."
        ></textarea>

        {/* Status */}
        <div className="h-8 bg-sky-50 border-t border-sky-100 flex items-center px-4">
            <span className="text-xs text-sky-700 font-semibold">
                {speechText ? "🟢 Receiving Audio..." : "Ready"}
            </span>
        </div>

      </div>
    </div>
  );
};

const AiButton = ({ label, onClick, color }) => {
    const colors = {
        blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
        green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    };
    return (
        <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${colors[color]}`}>
            {label}
        </button>
    )
}

export default Editor;