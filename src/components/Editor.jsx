import React, { useState, useEffect, useRef } from 'react';
import AiChat from './AiChat'; // ✅ FIXED: Added "from './AiChat'"

// 🟢 CONFIGURATION: API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Editor = ({ 
    // Data Props
    speechText, 
    manualText,
    setManualText, 
    
    // Command Objects
    translationCommand, 
    transliterationCommand,
    fontConvertCommand,
    
    // State Setters
    setIsTranslating, 
    setIsTransliterating,
    setIsConverting,
    
    // Loading Booleans
    isTranslating,
    isTransliterating,
    isConverting
}) => {
    
    // Ref to track the last appended text
    const lastProcessedSpeechRef = useRef('');
    
    // ✅ STATE: Toggle AI Chat Sidebar
    const [showChat, setShowChat] = useState(false);

    // --- 0. DEBUGGING: MOUNT CHECK ---
    useEffect(() => {
        console.log("✅ Editor Loaded."); 
        console.log("🌍 Backend Target URL:", API_BASE_URL);
    }, []);

    // --- 1. HANDLE SPEECH INPUT ---
    useEffect(() => {
        if (!speechText) return;
        if (speechText === lastProcessedSpeechRef.current) return;

        setManualText((prev) => {
            if (!prev) return speechText;
            const needsSpace = !prev.endsWith(' ') && !prev.endsWith('\n');
            return prev + (needsSpace ? ' ' : '') + speechText;
        });

        lastProcessedSpeechRef.current = speechText;
    }, [speechText, setManualText]); 

    // --- 2. HANDLE COMMAND TRIGGERS ---
    
    // 🟢 Translation Trigger
    useEffect(() => {
        if (translationCommand?.id) {
            if (translationCommand.textToTranslate) {
                translateText(translationCommand.textToTranslate, translationCommand.lang);
            } else {
                alert("Please type some text to translate first.");
            }
        }
    }, [translationCommand]);

    // 🟢 Transliteration Trigger
    useEffect(() => {
        if (transliterationCommand?.id && transliterationCommand.textToTransliterate) {
            transliterateText(transliterationCommand.textToTransliterate, transliterationCommand.script);
        }
    }, [transliterationCommand]);
    
    // 🟢 Font Conversion Trigger
    useEffect(() => {
        if (fontConvertCommand?.id && fontConvertCommand.textToConvert) {
            convertFont(fontConvertCommand.textToConvert, fontConvertCommand.font);
        }
    }, [fontConvertCommand]);


    // --- 3. API FUNCTIONS ---

    const translateText = async (text, targetLang) => {
        if (!text?.trim()) return;
        setIsTranslating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, target: targetLang })
            });
            if (!response.ok) throw new Error('Translation request failed.');
            const data = await response.json();
            setManualText(data.translatedText); 
        } catch (error) {
            console.error("❌ Translation Error:", error);
            alert(`Translation Failed: ${error.message}`);
        } finally {
            setIsTranslating(false);
        }
    };

    const transliterateText = async (text, targetScript) => {
        if (!text?.trim()) return;
        setIsTransliterating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const simText = targetScript === 'hi' ? "वकालतनामा (Transliterated)" : "Vakalatnama (Transliterated)";
            setManualText(simText);
        } catch (error) {
            console.error("Transliteration Error:", error);
        } finally {
            setIsTransliterating(false);
        }
    };

    const convertFont = async (text, targetFont) => {
        if (!text?.trim()) return;
        setIsConverting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const simText = targetFont === 'krutidev' ? "fo-e ;kfpdkdrkZ (Converted)" : text;
            setManualText(simText);
        } catch (error) {
            console.error("Font Error:", error);
        } finally {
            setIsConverting(false);
        }
    };

    const handleChange = (e) => {
        setManualText(e.target.value);
    };


    // --- UI RENDER ---
    return (
        <div className="flex-1 w-full h-full p-4 flex flex-col overflow-hidden bg-gray-50 relative">
            
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-2 flex-none">
                <h2 className="text-xl font-bold text-indigo-900">📄 Legal Draft</h2>
                <div className="flex gap-2">
                    <button className="p-2 bg-white border rounded shadow-sm hover:bg-gray-50 transition" title="Save Draft">💾</button>
                    <button className="p-2 bg-white border rounded shadow-sm hover:bg-gray-50 transition" title="Print">🖨️</button>
                    <button 
                        onClick={() => setManualText('')} 
                        className="p-2 bg-red-100 text-red-600 border border-red-200 rounded shadow-sm hover:bg-red-200 transition"
                        title="Clear Editor"
                    >🗑️</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-indigo-100 flex flex-col shadow-lg overflow-hidden relative">
                
                {/* AI Tools Bar */}
                <div className="bg-indigo-50 border-b border-indigo-100 p-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-indigo-400 uppercase">AI Tools:</span>
                    <AiButton label="✨ Fix Grammar" color="blue" />
                    <AiButton label="⚖️ Legal Tone" color="purple" />
                    <AiButton label="↔️ Expand" color="green" />
                    
                    {/* ✅ AI CHAT BUTTON */}
                    <AiButton 
                        label={showChat ? "❌ Close Chat" : "📝 Ai Chat"} 
                        color="blue" 
                        isActive={true} 
                        onClick={() => setShowChat(!showChat)} 
                    />
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex flex-1 relative overflow-hidden">
                    
                    {/* TEXT AREA */}
                    <textarea 
                        value={manualText}
                        onChange={handleChange}
                        className={`flex-1 h-full p-8 outline-none resize-none text-gray-800 font-sans text-lg leading-relaxed focus:bg-indigo-50/10 transition-all ${showChat ? 'w-2/3' : 'w-full'}`}
                        placeholder="Start speaking via the Sidebar or type here..."
                    ></textarea>

                    {/* ✅ AI CHAT SIDEBAR */}
                    {showChat && (
                        <div className="w-1/3 min-w-[320px] border-l border-indigo-100 bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
                             {/* Context passed to AI Chat */}
                            <AiChat contextText={manualText} />
                        </div>
                    )}

                </div>

                {/* Status Bar */}
                <div className="h-8 bg-sky-50 border-t border-sky-100 flex items-center justify-between px-4">
                    <span className="text-xs text-sky-700 font-semibold flex items-center gap-2">
                        {isTranslating || isTransliterating || isConverting ? (
                            <>
                                <span className="animate-spin h-3 w-3 border-2 border-sky-600 border-t-transparent rounded-full"></span>
                                Processing...
                            </>
                        ) : speechText ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Receiving Audio...
                            </>
                        ) : "Ready to Draft"}
                    </span>
                    <span className="text-xs text-gray-400">
                        {manualText ? manualText.split(/\s+/).filter(w => w).length : 0} words
                    </span>
                </div>

            </div>
        </div>
    );
};

// ✅ SUB-COMPONENT: Button
const AiButton = ({ label, color, isActive = false, onClick }) => {
    const colors = {
        blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
        purple: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
        green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
    };
    
    const disabledClass = !isActive ? "cursor-not-allowed opacity-70" : "cursor-pointer shadow-sm active:scale-95";

    return (
        <button 
            type="button" 
            onClick={onClick}
            disabled={!isActive} 
            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${colors[color]} ${disabledClass}`}
        >
            {label}
        </button>
    )
}

export default Editor;