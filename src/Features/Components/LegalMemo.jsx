import React, { useState } from "react";

const LegalMemo = ({ onBack }) => {
  const [memoQuery, setMemoQuery] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-2xl w-full mx-4 relative transform transition-all animate-scale-up">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600 text-xl shrink-0">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
             </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight leading-tight">
            What should I prepare a legal memo about?
          </h2>
        </div>

        {/* Text Area (Matches DBP exactly) */}
        <div className="relative mb-4">
          <textarea 
            className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all text-gray-700 resize-none placeholder:text-gray-400 font-medium"
            placeholder="e.g. what is the waqf bill and how does it impact..."
            maxLength={200}
            value={memoQuery}
            onChange={(e) => setMemoQuery(e.target.value)}
          />
          <div className="absolute bottom-4 right-6 text-[11px] font-bold text-gray-400">
            {memoQuery.length}/200
          </div>
        </div>

        {/* Helpful Tip */}
        <p className="text-sm text-gray-400 font-medium mb-10 leading-relaxed">
          You can ask follow up questions and do more research in the Legal Research Panel later on.
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-6">
          <button 
            onClick={onBack} 
            className="text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          
          <button 
            disabled={memoQuery.length === 0}
            className={`px-10 py-3.5 rounded-xl font-extrabold transition-all shadow-xl ${
              memoQuery.length > 0 
              ? "bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200 hover:translate-y-[-1px]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalMemo;