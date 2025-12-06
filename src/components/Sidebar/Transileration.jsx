import React, { useState } from 'react';

const TransliterationCard = ({ onTransliterate, isTransliterating }) => {
    // State for Transliteration Target (Output)
    const [targetScript, setTargetScript] = useState('en'); 

    return (
        // --- CARD 3: TRANSLITERATION (OUTPUT) ---
        <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100 shadow-sm">
            <h3 className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-2 uppercase">
                <span className="bg-white p-1 rounded shadow-sm text-lg">✍️</span> Transliteration
            </h3>
            
            <label className="text-[10px] text-gray-500 font-bold mb-1 block">CONVERT EDITOR TEXT TO:</label>
            
            {/* Script Selector for Transliteration (Roman or Devanagari) */}
            <select 
                value={targetScript}
                onChange={(e) => setTargetScript(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 mb-3 text-sm bg-white outline-none focus:border-indigo-500 cursor-pointer"
            >
                <option value="en">Roman Script (a.k.a. English)</option>
                <option value="hi">Devanagari (e.g., Hindi/Marathi Script)</option>
            </select>

            {/* The Button that triggers Transliteration in Editor */}
            <button 
                onClick={() => {
                    if(onTransliterate) {
                        onTransliterate(targetScript); 
                    }
                }}
                disabled={isTransliterating}
                className={`w-full py-2 rounded text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 ${
                    isTransliterating ? 'bg-amber-300 text-amber-700 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
            >
                <span>{isTransliterating ? '⏳' : '💡'}</span> 
                {isTransliterating ? 'Transliterating...' : 'Transliterate Script'}
            </button>
        </div>
    );
};

export default TransliterationCard;