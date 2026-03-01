import React, { useState } from "react";

// --- FEATURE IMPORTS ---
import AIDrafting from "./AIDrafting";
import ChatWithPDF from "./ChatWithPDF";
import ReviewDraft from "./ReviewDraft";
import UploadDraft from "./UploadDraft";
import LegalResearch from "./LegalResearch";
import LegalMemo from "./LegalMemo";
// import GenerateArguments from "./GenerateArguments"; 

/**
 * Samiksha, ensure that setIsAIGenerating and setManualText are passed 
 * as props from your main Dashboard/App component to this Hub.
 */
const LegalAIHub = ({ setIsAIGenerating, setManualText }) => {
  const [activeFeature, setActiveFeature] = useState("main");

  // --- NAVIGATION LOGIC ---
  // Passing the required props down to each feature to avoid "is not a function" errors
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

  if (activeFeature === "review") {
    return (
      <ReviewDraft 
        onBack={() => setActiveFeature("main")} 
        setIsAIGenerating={setIsAIGenerating} 
      />
    );
  }

  if (activeFeature === "uploadDraft") {
    return (
      <UploadDraft 
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

  if (activeFeature === "memo") {
    return (
      <LegalMemo 
        onBack={() => setActiveFeature("main")} 
        setIsAIGenerating={setIsAIGenerating} 
      />
    );
  }

  const featureCards = [
    {
      id: "drafting",
      category: "Draft",
      title: "AI Legal Drafting",
      desc: "Start by drafting and do legal research side by side.",
      icon: "✨",
      color: "from-indigo-500 to-blue-600",
      lightColor: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "review",
      category: "Draft",
      title: "Review Your Draft",
      desc: "Upload your own draft to improve grammar and check errors.",
      icon: "🔍",
      color: "from-blue-400 to-cyan-500",
      lightColor: "bg-blue-50 text-blue-600",
    },
    {
      id: "uploadDraft",
      category: "Draft",
      title: "Upload your Draft",
      desc: "Start drafting and legal research on existing files.",
      icon: "📤",
      color: "from-purple-500 to-indigo-500",
      lightColor: "bg-purple-50 text-purple-600",
    },
    {
      id: "research",
      category: "Research",
      title: "AI Legal Research",
      desc: "Do accurate legal research with sources and cases.",
      icon: "⚖️",
      color: "from-sky-400 to-blue-500",
      lightColor: "bg-sky-50 text-sky-600",
    },
    {
      id: "memo",
      category: "Research",
      title: "Legal Memo",
      desc: "Prepare comprehensive Legal Memos with citations.",
      icon: "📝",
      color: "from-violet-400 to-purple-500",
      lightColor: "bg-violet-50 text-violet-600",
    },
    {
      id: "pdfChat",
      category: "Research",
      title: "Chat with PDF",
      desc: "Upload a PDF, prepare list of dates, and ask questions.",
      icon: "💬",
      color: "from-fuchsia-500 to-pink-600",
      lightColor: "bg-fuchsia-50 text-fuchsia-600",
    },
    {
      id: "arguments",
      category: "Research",
      title: "Generate Arguments",
      desc: "Tell AI about the case or upload PDF to generate arguments.",
      icon: "🛡️",
      color: "from-indigo-600 to-violet-700",
      lightColor: "bg-indigo-50 text-indigo-700",
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-24 animate-fade-in">
      <div className="bg-white border-b border-gray-100 px-8 py-10 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Hi, Samiksha! 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Welcome to your premium Legal AI suite. Ready to win your next case?
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
             <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Drafting Suite</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.filter(c => c.category === "Draft").map((card) => (
              <FeatureCard key={card.id} card={card} onClick={() => setActiveFeature(card.id)} />
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
             <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
             <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Research Intelligence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
            {featureCards.filter(c => c.category === "Research").map((card) => (
              <FeatureCard key={card.id} card={card} onClick={() => setActiveFeature(card.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ card, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] transition-all duration-500 cursor-pointer overflow-hidden active:scale-95"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 -mr-10 -mt-10 rounded-full`}></div>

    <div className={`w-14 h-14 ${card.lightColor} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
      {card.icon}
    </div>

    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors">
      {card.title}
    </h3>
    <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6">
      {card.desc}
    </p>

    <div className="flex items-center text-indigo-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
      Open Tool 
      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>
  </div>
);

export default LegalAIHub;