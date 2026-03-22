import React, { useState } from "react";
import { PenTool, Search, FileText, ArrowRight, Sparkles, Scale, MessageSquare } from "lucide-react";

// --- FEATURE IMPORTS ---
import AIDrafting from "./AIDrafting";
import LegalResearch from "./LegalResearch";
import ChatWithPDF from "./ChatWithPDF";

const LegalAIHub = ({ setIsAIGenerating, setManualText }) => {
  const [activeFeature, setActiveFeature] = useState("main");

  // --- NAVIGATION LOGIC ---
  if (activeFeature === "drafting") {
    return (
      <AIDrafting 
        onBack={() => setActiveFeature("main")} 
        setIsAIGenerating={setIsAIGenerating} 
        setManualText={setManualText} 
      />
    );
  }

  if (activeFeature === "pdfChat") {
    return (
      <ChatWithPDF 
        onBack={() => setActiveFeature("main")} 
        setIsAIGenerating={setIsAIGenerating} 
      />
    );
  }

  if (activeFeature === "research") {
    return (
      <LegalResearch 
        onBack={() => setActiveFeature("main")} 
        setIsAIGenerating={setIsAIGenerating} 
      />
    );
  }

  return (
    <div className="flex-1 bg-white min-h-screen overflow-y-auto pb-20">
      
      {/* HEADER SECTION - Minimalist & Clean */}
      <div className="max-w-7xl mx-auto px-8 pt-16 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles size={14} /> TNT Legal AI Suite v2.4
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Core AI Workspaces
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl font-medium">
          Select a specialized workspace to begin your legal task. Precision-engineered for modern law practice.
        </p>
      </div>

      {/* FEATURE GRID - 3 High-Impact Workspaces */}
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 1. AI LEGAL DRAFTING */}
        <WorkspaceCard 
          icon={<PenTool size={32} />}
          title="DraftMaster Pro"
          desc="Generate high-quality legal petitions, bail applications, and contracts in seconds with AI precision."
          color="bg-indigo-600"
          lightColor="bg-indigo-50"
          textColor="text-indigo-600"
          onClick={() => setActiveFeature("drafting")}
        />

        {/* 2. AI LEGAL RESEARCH */}
        <WorkspaceCard 
          icon={<Scale size={32} />}
          title="AI Legal Research"
          desc="Search across Indian Case Laws and Statutes. Get cited judgments and research memos instantly."
          color="bg-blue-600"
          lightColor="bg-blue-50"
          textColor="text-blue-600"
          onClick={() => setActiveFeature("research")}
        />

        {/* 3. CHAT WITH PDF */}
        <WorkspaceCard 
          icon={<MessageSquare size={32} />}
          title="Chat with PDF"
          desc="Analyze 42+ page documents. Extract chronologies, important dates, and chat with scanned legal files."
          color="bg-fuchsia-600"
          lightColor="bg-fuchsia-50"
          textColor="text-fuchsia-600"
          onClick={() => setActiveFeature("pdfChat")}
        />

      </div>

      {/* FOOTER NOTE */}
      <div className="max-w-7xl mx-auto px-8 mt-20">
        <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400">
                    <FileText size={20} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800 uppercase tracking-tighter">Enterprise Grade Security</p>
                    <p className="text-xs text-slate-500 font-medium italic">Your legal data is encrypted and private.</p>
                </div>
            </div>
            <span className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase italic">Talk N Type</span>
        </div>
      </div>
    </div>
  );
};

/* COMPONENT: WorkspaceCard */
const WorkspaceCard = ({ icon, title, desc, color, lightColor, textColor, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative h-[420px] bg-white rounded-[40px] border border-slate-100 p-10 flex flex-col justify-between shadow-sm hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-2 active:scale-95"
  >
    {/* Decorative Background Blob */}
    <div className={`absolute -right-20 -bottom-20 w-64 h-64 ${lightColor} rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700`}></div>
    
    <div>
      <div className={`w-20 h-20 ${lightColor} ${textColor} rounded-[28px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-white/50`}>
        {icon}
      </div>
      
      <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      
      <p className="text-slate-500 font-medium leading-relaxed">
        {desc}
      </p>
    </div>

    <div className={`flex items-center justify-center w-full py-4 ${color} text-white rounded-2xl font-bold text-sm tracking-widest uppercase opacity-90 group-hover:opacity-100 transition-all shadow-lg group-hover:shadow-indigo-200`}>
      Enter Workspace
      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default LegalAIHub;