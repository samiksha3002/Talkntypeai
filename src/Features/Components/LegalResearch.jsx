import React, { useState } from "react";
import { Search, BookOpen, Globe, MessageSquare, Save, History, ExternalLink, ChevronRight, Loader2 } from "lucide-react";

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
    "/api/analyze-document",
    "/api/legal-research" // Legal research added to Python route
  ];

  if (pythonEndpoints.includes(endpoint)) {
    return isLocal ? `http://localhost:8000${endpoint}` : `${PYTHON_API_URL}${endpoint}`;
  }
  return isLocal ? `http://localhost:10000${endpoint}` : `${NODE_API_URL}${endpoint}`;
};

const LegalResearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [researchData, setResearchData] = useState(null);
  const [history, setHistory] = useState([
    { id: 1, title: "Bail provisions under Section 480 BNSS" },
    { id: 2, title: "Quashing of FIR in matrimonial disputes" },
  ]);

  const handleResearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResearchData(null); // Purana data clear karein naye search se pehle

    try {
      // PYTHON Route for Real-time Legal Research
      const response = await fetch(getApiUrl("/api/legal-research"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      
      // Backend se jo 'summary', 'verified_laws', aur 'web_judgments' aa raha hai usey set karein
      setResearchData(data);
      
      // History update karein
      setHistory((prev) => [{ id: Date.now(), title: query }, ...prev]);
    } catch (error) {
      console.error("Research failed:", error);
      alert("Research failed. Please ensure the Python backend is live and Tavily API is configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR: Recent History */}
      <div className="w-72 bg-white border-r flex flex-col shrink-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" /> History
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setQuery(item.title)}
              className="p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
            >
              <p className="text-xs font-medium text-gray-600 truncate">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER PANEL: Main Research Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Header */}
        <div className="bg-white p-6 border-b shadow-sm">
          <form onSubmit={handleResearch} className="max-w-3xl mx-auto relative">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask any legal question (e.g., PMLA arrest guidelines 2026)..."
              className="w-full pl-12 pr-32 py-4 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              disabled={loading}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Research"}
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-600 font-bold animate-pulse">Fetching Real-Time Legal Data...</p>
            </div>
          ) : !researchData ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <BookOpen className="w-16 h-16 mb-4 text-indigo-300" />
              <p className="text-lg font-bold text-slate-900">Your Legal Research Hub</p>
              <p className="text-sm">Verified by Indian Kanoon & Tavily AI Agent</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
              {/* Summary Section */}
              <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" /> Analysis Gist
                </h3>
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 leading-relaxed text-gray-700 text-sm whitespace-pre-line">
                    {researchData.summary}
                </div>
              </section>

              {/* Web Judgments (Tavily Results) */}
              <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" /> Web Precedents & News
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {researchData.web_judgments?.length > 0 ? (
                    researchData.web_judgments.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <h4 className="font-bold text-xs text-blue-800 mb-2 group-hover:underline flex items-start justify-between gap-2">
                          {res.title} <ExternalLink className="w-3 h-3 shrink-0" />
                        </h4>
                        <p className="text-[10px] text-gray-500 line-clamp-3">{res.content}</p>
                      </a>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No web results found.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Resources & Statutes */}
      <div className="w-80 bg-white border-l shrink-0 flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Resources</h3>
          <Save className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Indian Kanoon Data Mapping */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Verified Laws (Indian Kanoon)
            </h4>
            <div className="space-y-3">
              {researchData?.verified_laws?.length > 0 ? (
                researchData.verified_laws.map((doc, i) => (
                  <div key={i} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <p className="text-[11px] font-bold text-emerald-900 mb-1 leading-tight">{doc.title}</p>
                    <a 
                      href={`https://indiankanoon.org/doc/${doc.tid}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 hover:underline mt-2"
                    >
                      Read Full Act <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-gray-400 italic">No verified statutes loaded yet.</p>
              )}
            </div>
          </div>

          {/* Guidelines / Tips */}
          <div className="p-5 bg-indigo-50 rounded-[24px] border border-indigo-100">
            <h4 className="text-[11px] font-black text-indigo-900 mb-2 italic">Pro Tip</h4>
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              Always cross-verify Section numbers with the latest BNSS/BNS 2023 index if citations appear outdated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalResearch;