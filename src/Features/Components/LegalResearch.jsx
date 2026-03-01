import React, { useState } from "react";

const LegalResearch = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div className="flex-1 bg-white h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center px-8 justify-between bg-white shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">AI Legal Research</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Source: SC & HC Database</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Search Area */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-white rounded-3xl shadow-sm mb-6 animate-bounce">⚡</div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">AI Legal Research</h2>
            <p className="text-gray-500 font-medium italic">Get accurate answers for your legal queries in seconds</p>
          </div>

          {/* Premium Search Box */}
          <div className="relative group mb-12">
            <input 
              type="text" 
              placeholder="Enter your legal question... (e.g., Procedure for Section 148A)"
              className="w-full p-6 pl-16 bg-white border border-gray-100 rounded-[32px] shadow-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-lg font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Search
            </button>
          </div>

          {/* Example Cards (Matches DBP) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
               <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">📜</div>
               <h3 className="font-bold text-gray-800 mb-2">Section 148A Income Tax</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tax Law</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">👨‍👩‍👧</div>
               <h3 className="font-bold text-gray-800 mb-2">Hindu daughter coparcenary</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Property Law</p>
            </div>
          </div>
          
          {/* TNT Unique Feature: Nagpur HC Cases */}
          <div className="mt-12 p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Nagpur Bench Priority Search</h3>
                <p className="opacity-80 text-sm mb-6">Our AI prioritizes judgments from the Bombay High Court (Nagpur Bench) for local accuracy.</p>
                <button className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/30 transition-all border border-white/30">Activate Local Search</button>
             </div>
             <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 rotate-12">⚖️</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalResearch;