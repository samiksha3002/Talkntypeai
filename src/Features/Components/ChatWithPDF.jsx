import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, Send, Loader2, Calendar, Layout, ListChecks, 
  Download, Maximize2, X, MessageSquare, ZoomIn, ZoomOut, RotateCw 
} from "lucide-react";

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

const ChatWithPDF = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeline, setTimeline] = useState(null);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'timeline'
  const [zoom, setZoom] = useState(100);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================================
  // CORE FUNCTIONS
  // ==========================================

  // ✅ FIX: Page Jump logic to scroll PDF iframe
  const handlePageJump = (pageNum) => {
    if (!previewUrl) return;
    const baseUrl = previewUrl.split('#')[0];
    const newUrl = `${baseUrl}#page=${pageNum}`;
    setPreviewUrl(newUrl);
    console.log("Navigating to page:", pageNum);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
      analyzeDocument(uploadedFile);
    }
  };

  const analyzeDocument = async (uploadedFile) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch(getApiUrl("/api/analyze-document"), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setTimeline(data.timeline);
        setMessages([{ role: "ai", text: "Document analyzed. I've prepared a chronology in the Timeline tab." }]);
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !file || isLoading) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/chat-with-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userMsg, 
          context: timeline || "User has uploaded a document named " + file.name, 
          history: messages.slice(-5) 
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { role: "ai", text: "Error connecting to Legal Brain. Please ensure backend is active." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      
      {/* LEFT: PROFESSIONAL PDF VIEWPORT */}
      <div className="w-1/2 flex flex-col bg-slate-900 border-r border-slate-700 relative">
        <div className="h-14 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <FileText size={18} className="text-indigo-400" />
            </div>
            <span className="text-slate-200 text-sm font-semibold truncate max-w-[200px]">
              {file ? file.name : "No Document Selected"}
            </span>
          </div>
          
          {file && (
            <div className="flex items-center bg-slate-700 rounded-lg p-1 gap-1">
              <button onClick={() => setZoom(z => Math.max(z-20, 50))} className="p-1.5 hover:bg-slate-600 rounded text-slate-300"><ZoomOut size={16} /></button>
              <span className="text-[10px] text-slate-400 px-2 font-mono">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(z+20, 200))} className="p-1.5 hover:bg-slate-600 rounded text-slate-300"><ZoomIn size={16} /></button>
              <div className="w-[1px] h-4 bg-slate-600 mx-1" />
              <button className="p-1.5 hover:bg-slate-600 rounded text-slate-300"><RotateCw size={16} /></button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-slate-900 flex justify-center p-4 custom-scrollbar">
          {!file ? (
            <div className="flex flex-col items-center justify-center text-slate-500 max-w-sm text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
                <FileText size={40} className="text-slate-600" />
              </div>
              <h3 className="text-slate-200 font-bold text-lg mb-2">Ready to Analyze</h3>
              <p className="text-sm opacity-60 mb-8">Upload FIRs, Judgments, or Petitions for instant AI chronology & chat.</p>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
              >
                Choose PDF File
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf" />
            </div>
          ) : (
            <div 
                className="transition-all duration-200 ease-in-out shadow-2xl" 
                style={{ width: `${zoom}%`, minWidth: '100%' }}
            >
              <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full min-h-[85vh] rounded-sm" title="PDF Preview" />
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white/10 p-8 rounded-[40px] border border-white/10 flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
              <p className="text-white font-bold tracking-widest uppercase text-[10px]">AI Neural Scanning...</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: SMART WORKSPACE */}
      <div className="w-1/2 flex flex-col bg-white">
        
        {/* Modern Tabs Navigation */}
        <div className="h-16 border-b flex items-center px-8 gap-8 shrink-0">
          <button 
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 text-sm font-bold h-full border-b-2 transition-all ${
              activeTab === "chat" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <MessageSquare size={18} /> Chat Bot
          </button>
          <button 
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 text-sm font-bold h-full border-b-2 transition-all ${
              activeTab === "timeline" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calendar size={18} /> Chronology
            {timeline && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />}
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          
          {/* TAB 1: CHAT INTERFACE */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${activeTab === "chat" ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-5 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                    msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    
                    {msg.role === "ai" && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-3">
                          <ListChecks size={12} /> Verified Sources
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {(msg.text.match(/Page \d+/g) ? [...new Set(msg.text.match(/Page \d+/g))] : []).map((pageRef, idx) => (
                            <button
                              key={idx}
                              onClick={() => handlePageJump(pageRef.split(' ')[1])}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[11px] font-bold transition-all border border-indigo-100 active:scale-95"
                            >
                              <FileText size={10} /> {pageRef.toUpperCase()}
                            </button>
                          ))}
                          
                          {!msg.text.match(/Page \d+/g) && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded italic">Full Document Context</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t bg-white">
              <form onSubmit={sendMessage} className="relative group">
                {file && !isLoading && (
                  <div className="absolute -top-4 left-6 px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-bold rounded border border-indigo-100 uppercase">
                    Supports: EN • HI • MR
                  </div>
                )}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={!file ? "Please upload a document first..." : "Ask in English, हिंदी या मराठी..."}
                  disabled={!file || isLoading}
                  className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white py-4 pl-6 pr-14 rounded-2xl text-sm transition-all outline-none"
                />
                <button 
                  disabled={!file || isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </div>
          </div>

          {/* TAB 2: CHRONOLOGY */}
          <div className={`absolute inset-0 p-8 overflow-y-auto bg-white transition-transform duration-300 ${activeTab === "timeline" ? "translate-x-0" : "-translate-x-full"}`}>
            {!timeline ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Calendar size={48} className="text-slate-300 mb-4" />
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Chronology not generated yet</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Case Chronology</h2>
                  <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all">
                    <Download size={14} /> EXPORT TO EDITOR
                  </button>
                </div>
                
                <div className="border-l-2 border-indigo-100 ml-4 space-y-8">
                  <div className="relative pl-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 hover:border-indigo-200 transition-all">
                      <p className="whitespace-pre-wrap text-sm leading-loose text-slate-700 font-medium">
                        {timeline}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatWithPDF;