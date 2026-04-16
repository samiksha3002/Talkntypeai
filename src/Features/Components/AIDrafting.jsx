import React, { useState, useEffect, useRef } from "react";
import { Maximize2, ListChecks, Sparkles, Wand2, Scale, ChevronLeft, ChevronRight, Gavel, Calendar, ShieldAlert, Download ,FileText } from "lucide-react";

// ==========================================
// URL CONFIGURATION (NODE vs PYTHON)
// ==========================================
const NODE_API_URL = "https://talkntypeai.onrender.com"; 
const PYTHON_API_URL = "https://talkntype-ai-python.onrender.com";

const getApiUrl = (endpoint) => {
  const isLocal = window.location.hostname === "localhost";
  const pythonEndpoints = [
    "/api/generate-legal-draft",
    "/api/ai-command",
    "/api/chat-with-pdf",
    "/api/analyze-document"
  ];

  if (pythonEndpoints.includes(endpoint)) {
    return isLocal ? `http://localhost:8000${endpoint}` : `${PYTHON_API_URL}${endpoint}`;
  }
  return isLocal ? `http://localhost:10000${endpoint}` : `${NODE_API_URL}${endpoint}`;
};

// ==========================================
// FEATURE 4: BEAUTIFIED EMERALD CASE METER
// ==========================================
const CaseMeter = ({ score }) => {
  const displayScore = score || 75;
  return (
    <div className="mb-8 p-6 bg-white rounded-[32px] border border-emerald-100 shadow-[0_20px_50px_rgba(16,185,129,0.1)] relative overflow-hidden group animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[3px] text-emerald-600 block mb-1">Success Probability</span>
          <h3 className="text-4xl font-black text-slate-900 leading-none">{displayScore}<span className="text-lg text-emerald-500">%</span></h3>
        </div>
        <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600">
           <Scale size={24} />
        </div>
      </div>
      
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-[2px]">
        <div 
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
          style={{ width: `${displayScore}%` }}
        ></div>
      </div>
      <p className="mt-3 text-[10px] text-slate-400 font-bold italic uppercase tracking-wider text-center">Strong Legal Grounds Detected</p>
    </div>
  );
};

const AIDrafting = ({ onBack, setManualText, setIsAIGenerating }) => {
  const [step, setStep] = useState(1);
  const [caseFacts, setCaseFacts] = useState("");
  const [language, setLanguage] = useState("English");
  const [rawDraft, setRawDraft] = useState("");
  const [liveDraft, setLiveDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Floating Menu & UI States
  const [selectedText, setSelectedText] = useState("");
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [rightPanelWidth, setRightPanelWidth] = useState(350); 
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [file, setFile] = useState(null); // File ko store karne ke liye

  // Intelligence Panel Data (Updated for new features)
  const [intelligence, setIntelligence] = useState({
    judgments: "Awaiting generation...",
    arguments: "Awaiting generation...",
    timeline: "Awaiting chronology data...",
    strategy: null 
  });

  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [variables, setVariables] = useState({
    "{name_of_applicant}": "",
    "{father_name_of_applicant}": "",
    "{age_of_applicant}": "",
    "{address_of_applicant}": "",
    "{police_station_name}": "",
    "{bail_application_number}": "",
    "{year}": new Date().getFullYear().toString(),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ==========================================
  // 1. SMART SYNC & BOLD RENDERING
  // ==========================================
  useEffect(() => {
    if (!rawDraft) return;
    let updated = rawDraft;

    const placeholderPattern = /\[([^\]]+)\]/g;
    updated = rawDraft.replace(placeholderPattern, (match, content) => {
      const lower = content.toLowerCase();
      if (lower.includes("name") && (lower.includes("applicant") || lower.includes("accused"))) return variables["{name_of_applicant}"] || match;
      if (lower.includes("father") || lower.includes("parent")) return variables["{father_name_of_applicant}"] || match;
      if (lower.includes("address")) return variables["{address_of_applicant}"] || match;
      if (lower.includes("police station")) return variables["{police_station_name}"] || match;
      if (lower.includes("number") || lower.includes("xxxx")) return variables["{bail_application_number}"] || match;
      if (lower.includes("year")) return variables["{year}"] || match;
      return match;
    });

    setLiveDraft(updated);
  }, [rawDraft, variables]);

  const renderFormattedDraft = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanText = part.replace(/\*\*/g, "");
        const isJudgment = cleanText.toLowerCase().includes("vs") || cleanText.toLowerCase().includes(" v ");
        return (
          <b 
            key={i} 
            onClick={() => isJudgment && window.open(`https://indiankanoon.org/search/?q=${cleanText}`, '_blank')}
            className={`font-bold text-slate-900 ${isJudgment ? 'cursor-pointer hover:text-indigo-600 hover:underline decoration-indigo-300' : ''}`}
          >
            {cleanText}
          </b>
        );
      }
      return part;
    });
  };

  // ==========================================
  // 2. TEXT SELECTION & AI COMMANDS
  // ==========================================
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text && step === 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setMenuPos({ x: rect.left, top: rect.top + window.scrollY - 60 });
    } else {
      setSelectedText("");
    }
  };

  const applyAICommand = async (command) => {
    if (!selectedText) return;
    setLocalIsGenerating(true);
    try {
      const response = await fetch(getApiUrl("/api/ai-command"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, text: selectedText, context: caseFacts }),
      });
      const data = await response.json();
      if (data.success) {
        setRawDraft(prev => prev.replace(selectedText, data.newText));
        setSelectedText("");
      }
    } catch (err) {
      alert("Command failed. Check server connection.");
    } finally {
      setLocalIsGenerating(false);
    }
  };

  const onFileSelect = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile); // Isse state update hogi
      setStep(2); // Isse typing area khulega
    }
  };
  // ==========================================
  // 3. GENERATION LOGIC
  // ==========================================
 const handleGenerateDraft = async () => {
    // Validation: Agar facts khali hain AUR koi file bhi nahi hai, toh alert dein
    if (!caseFacts.trim() && !file) {
      return alert("Please enter instructions or upload a PDF to proceed.");
    }

    setLocalIsGenerating(true);

    try {
      let response;
      
      // CASE 1: Agar PDF upload kiya gaya hai
      if (file) {
        const formData = new FormData();
        formData.append("file", file); // PDF file
        formData.append("facts", caseFacts || "Generate draft from this document"); // User instruction
        formData.append("language", language);
        formData.append("documentType", null);

        response = await fetch(getApiUrl("/api/generate-legal-draft"), {
          method: "POST",
          // Note: FormData bhejte waqt Content-Type header manually nahi dalna chahiye
          body: formData, 
        });
      } 
      // CASE 2: Agar sirf typing wala method use ho raha hai
      else {
        response = await fetch(getApiUrl("/api/generate-legal-draft"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facts: caseFacts,
            language: language,
            documentType: null
          }),
        });
      }

      const data = await response.json();

      // Backend response processing (keeping your original logic intact)
      if (data && Array.isArray(data)) {
        const [draft, judgments, argumentsText, timeline, affidavit, strategy] = data;

        // 1. Set Main Petition
        setRawDraft(draft);

        // 2. Right Side Panel (Intelligence)
        setIntelligence({
          judgments: judgments || "No specific cases found.",
          arguments: argumentsText || "Preparing strategy...",
          timeline: timeline || "Timeline not available.",
          strategy: {
            win_probability: parseInt(strategy?.match(/\d+/)?.[0]) || 75,
            opponent_args: strategy || "Analyzing defense..."
          }
        });

        // 3. Append Affidavit (Legal Bundle format)
        setRawDraft(prev => prev + "\n\n---\n\n" + (affidavit || ""));

        setStep(3);
      } else {
        alert("Response format error from backend.");
      }
    } catch (error) {
      console.error("Drafting Error:", error);
      alert("Backend connection failed! Ensure your Python server is running.");
    } finally {
      setLocalIsGenerating(false);
    }
  };


  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/chat-with-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, context: caseFacts, history: chatHistory }),
      });
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Brain offline." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const SpinnerOverlay = () => (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={40} />
      </div>
      <h2 className="mt-8 text-2xl font-black text-slate-800 tracking-tight">LexScript AI is Drafting...</h2>
      <p className="mt-2 text-slate-500 italic tracking-wide">Calculating Probability & Stretching Grounds to 7 Pages</p>
    </div>
  );

  if (step === 1) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-3xl w-full mx-4 text-center relative animate-scale-up">
        <button onClick={onBack} className="absolute top-8 right-10 text-slate-300 hover:text-slate-600 text-3xl transition-colors">✕</button>
        <h2 className="text-4xl font-black mb-12 text-slate-900 tracking-tight">Start Drafting</h2>
        <div className="grid grid-cols-2 gap-10">
          <div onClick={() => setStep(2)} className="group border-2 border-dashed p-12 rounded-[40px] cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">✍️</div>
            <h3 className="font-black text-xl text-slate-800">Type Facts</h3>
          </div>
          <div onClick={() => fileInputRef.current.click()} className="group border-2 border-dashed p-12 rounded-[40px] cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📤</div>
            <h3 className="font-black text-xl text-slate-800">Upload PDF</h3>
           {/* Line 308 ko aise replace karein */}
<input 
  type="file" 
  ref={fileInputRef} 
  className="hidden" 
  onChange={onFileSelect} 
  accept=".pdf" 
/>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      {localIsGenerating && <SpinnerOverlay />}
      <div className="bg-white p-10 rounded-[40px] max-w-3xl w-full shadow-2xl">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-slate-900"><Scale className="text-indigo-600" /> Case Facts</h2>
        {/* Line 327 ke baad add karein */}
{file && (
  <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top duration-300">
    <FileText className="text-emerald-600" size={18} />
    <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[200px]">
      Attached: {file.name}
    </span>
    <button 
      onClick={() => setFile(null)} 
      className="ml-auto text-emerald-400 hover:text-emerald-600 p-1 transition-colors"
      title="Remove file"
    >
      ✕
    </button>
  </div>
)}
        <textarea 
            className="w-full h-72 p-8 bg-slate-50 border border-slate-200 rounded-[32px] outline-none focus:border-indigo-500 text-lg leading-relaxed text-slate-700" 
            value={caseFacts} 
            onChange={(e) => setCaseFacts(e.target.value)} 
            placeholder="Type your case story here (FIR No, Date of Marriage, etc.)..." 
        />
        <div className="mt-10 flex justify-between items-center">
          <button onClick={() => setStep(1)} className="font-bold text-slate-400 hover:text-slate-600">Cancel</button>
          <div className="flex gap-4">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-slate-100 px-6 py-4 rounded-2xl font-black text-sm outline-none">
              <option value="English">English</option>
              <option value="Marathi">Marathi</option>
              <option value="Hindi">Hindi</option>
<option value="Gujarati">Gujarati</option>
               
            </select>
            <button onClick={handleGenerateDraft} className="px-12 py-4 bg-indigo-600 text-white rounded-[20px] font-black shadow-xl shadow-indigo-100 transition-all transform active:scale-95">Generate  Draft</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden animate-fade-in font-sans">
      {localIsGenerating && <SpinnerOverlay />}
      
      <div className="h-16 bg-white border-b flex items-center px-10 justify-between shrink-0 shadow-sm z-20">
        <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-500 font-black text-sm hover:text-indigo-600 transition-all">
          <ChevronLeft size={20} /> Back to Facts
        </button>
        <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">LexScript 2.0 Engine</span>
            <button 
  onClick={() => window.print()} 
  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg flex items-center gap-2 transition-all active:scale-95"
>
  <Download size={18} /> Print Court Bundle
</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: VARIABLES */}
        <div className="w-72 bg-white border-r p-8 overflow-y-auto shrink-0 shadow-inner custom-scrollbar">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Wand2 size={14} /> Party Data</h3>
          <div className="space-y-6">
            {Object.keys(variables).map((key) => (
              <div key={key}>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 transition-colors hover:text-indigo-600">
                    {key.replace(/[{}]/g, "").replace(/_/g, " ")}
                </label>
                <input 
                    type="text" 
                    value={variables[key]} 
                    onChange={(e) => setVariables({...variables, [key]: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm" 
                    placeholder="Enter value..." 
                />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: EDITABLE CANVAS */}
        <div className="flex-1 bg-slate-200/50 overflow-y-auto p-12 relative custom-scrollbar" onMouseUp={handleTextSelection}>
          {selectedText && (
            <div className="fixed bg-white shadow-2xl rounded-2xl border border-slate-100 p-1.5 flex gap-1.5 z-[200] animate-in fade-in zoom-in duration-200" style={{ left: menuPos.x, top: menuPos.top }}>
              <button onClick={() => applyAICommand("Expand Ground")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                <Maximize2 size={14} /> Expand
              </button>
              <button onClick={() => applyAICommand("Make Professional")} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                <Scale size={14} /> Legalize
              </button>
            </div>
          )}
          <div className="w-full max-w-[850px] mx-auto bg-white shadow-2xl min-h-[1200px] p-24 border border-slate-100 relative mb-20 ring-1 ring-slate-200">
            <div 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => setRawDraft(e.target.innerText)}
              className="outline-none whitespace-pre-wrap font-serif text-[17px] leading-[2.2] text-slate-800 text-justify selection:bg-indigo-100"
            >
              {!liveDraft ? (
                <div className="flex flex-col items-center justify-center h-[500px]">
                   <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                   <p className="text-slate-400 font-bold italic">Drafting your detailed petition bundle...</p>
                </div>
              ) : renderFormattedDraft(liveDraft)}
            </div>
            <div className="mt-24 text-center text-[10px] text-slate-300 border-t pt-12 uppercase tracking-[6px] font-black italic">
                Authenticated by TNT NextGen Legal AI
            </div>
          </div>
        </div>

        {/* RIGHT: RESIZABLE INTELLIGENCE HUB */}
        <div style={{ width: `${rightPanelWidth}px` }} className="bg-white border-l p-8 overflow-y-auto shrink-0 flex flex-col relative transition-all duration-300 shadow-2xl z-10">
          <button 
            onClick={() => setRightPanelWidth(rightPanelWidth === 350 ? 550 : 350)}
            className="absolute left-[-15px] top-1/2 bg-white border border-slate-200 w-8 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 shadow-lg z-50"
          >
            {rightPanelWidth === 350 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <CaseMeter score={intelligence.strategy?.win_probability} />

          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 border-b pb-4 flex items-center gap-2">
            <Sparkles size={14} /> Legal Intelligence
          </h3>
          
          <div className="p-6 rounded-3xl border border-emerald-100 bg-emerald-50/30 mb-4">
            <h4 className="font-black text-emerald-800 text-[10px] mb-4 uppercase flex items-center gap-2"><Gavel size={14}/> Landmark Judgments</h4>
            <div className="text-slate-700 text-[12px] leading-relaxed italic">{renderFormattedDraft(intelligence.judgments)}</div>
          </div>
          
          <div className="p-6 rounded-3xl border border-indigo-100 bg-indigo-50/30 mb-4">
            <h4 className="font-black text-indigo-800 text-[10px] mb-4 uppercase flex items-center gap-2"><ListChecks size={14}/> Winning Arguments</h4>
            <div className="text-slate-700 text-[12px] leading-relaxed italic">{renderFormattedDraft(intelligence.arguments)}</div>
          </div>

          <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/30 mb-4">
            <h4 className="font-black text-blue-800 text-[10px] mb-4 uppercase flex items-center gap-2"><Calendar size={14}/> Case Timeline</h4>
            <div className="text-slate-700 text-[11px] font-mono leading-relaxed whitespace-pre-wrap">{renderFormattedDraft(intelligence.timeline)}</div>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 rounded-[32px] border border-rose-100 bg-rose-50/30 hover:bg-rose-50/50 transition-all shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                  <ShieldAlert size={16} />
                </div>
                <h4 className="font-black text-rose-900 text-[11px] uppercase tracking-wider">Opponent Strategy</h4>
              </div>
              <div className="text-slate-700 text-[12px] leading-[1.8] font-medium italic">
                {intelligence.strategy?.opponent_args ? (
                    <div className="space-y-3">
                        {intelligence.strategy.opponent_args.split('\n').map((point, idx) => (
                            <p key={idx} className="flex gap-2">
                                <span className="text-rose-500 font-bold">•</span>
                                {point.replace(/^- /, '')}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4 gap-2">
                        <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] uppercase font-black text-rose-300 tracking-widest">Analyzing Defense...</p>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-8 border border-slate-100 rounded-[32px] overflow-hidden bg-white shadow-xl flex flex-col h-[350px]">
              <div className="bg-slate-900 p-5 text-white text-[11px] font-black uppercase flex items-center gap-2">
                <Sparkles size={14} /> Case Analysis Bot
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`${msg.role === 'user' ? 'ml-auto bg-indigo-600 text-white rounded-br-none' : 'mr-auto bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'} p-3.5 rounded-2xl max-w-[90%] text-[11px] leading-relaxed shadow-sm`}>
                    {msg.text}
                  </div>
                ))}
                {isChatLoading && <div className="text-[10px] text-slate-400 font-bold italic animate-pulse">Researching...</div>}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask AI..." className="flex-1 text-[11px] outline-none px-4 py-2.5 bg-slate-50 rounded-xl" />
                <button type="submit" className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center">➔</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDrafting;

const styles = `
  @media print {
    nav, .h-16, .w-72, .bg-white.border-l, button, .fixed, .z-20 {
      display: none !important;
    }
    .flex-1 {
      padding: 0 !important;
      background: white !important;
      overflow: visible !important;
    }
    .max-w-[850px] {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      width: 100% !important;
    }
    body {
      background: white !important;
    }
  }
`;

const StyleTag = () => <style>{styles}</style>;