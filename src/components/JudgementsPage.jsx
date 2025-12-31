import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JudgementsPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Buttons data with specific color themes
  const dashboardItems = [
    // RED - Urgent/New
    { label: "Latest Cases", color: "bg-rose-500 hover:bg-rose-600 border-rose-700", type: "urgent" },
    { label: "New Criminal Laws", color: "bg-rose-500 hover:bg-rose-600 border-rose-700", type: "urgent" },
    { label: "Latest News", color: "bg-rose-500 hover:bg-rose-600 border-rose-700", type: "urgent" },
    
    // BLUE - Research/Search (Kanoon API Integration point)
    { label: "Subject/Topic Search", color: "bg-sky-500 hover:bg-sky-600 border-sky-700", type: "search" },
    { label: "Citation Search", color: "bg-sky-500 hover:bg-sky-600 border-sky-700", type: "search" },
    { label: "Advance Search", color: "bg-sky-500 hover:bg-sky-600 border-sky-700", type: "search" },
    { label: "Nominal Search", color: "bg-sky-500 hover:bg-sky-600 border-sky-700", type: "search" },
    { label: "Judges/Adv. Search", color: "bg-sky-500 hover:bg-sky-600 border-sky-700", type: "search" },
    
    // GREEN - Laws & Reports
    { label: "Central Laws", color: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700", type: "resource" },
    { label: "State Laws", color: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700", type: "resource" },
    { label: "Overruled Cases", color: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700", type: "resource" },
    { label: "Law Comm. Reports", color: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700", type: "resource" },
  ];

  const handleButtonClick = () => {
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-white pb-24 font-sans relative">
      
      {/* ================= 1. TOP INFINITE SCROLLING TICKER ================= */}
      <div className="bg-slate-900 py-2 overflow-hidden border-b border-slate-700">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-white text-xs font-bold tracking-widest uppercase px-4">
            🚀 NOTICE: The legal database and "Subject Search" engine are currently under maintenance for system upgrades. New judgements will be live shortly. Stay tuned! ⚖️
          </span>
          <span className="text-white text-xs font-bold tracking-widest uppercase px-4">
             🚀 NOTICE: The legal database and "Subject Search" engine are currently under maintenance for system upgrades. New judgements will be live shortly. Stay tuned! ⚖️
          </span>
        </div>
      </div>

      {/* ================= 2. HEADER SECTION ================= */}
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
  <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    
    {/* ================= LOGO SECTION ================= */}
    <div className="flex items-center gap-3">
      {/* Agar aapka logo public folder mein 'tnt-logo.png' naam se hai */}
      <div className="h-40 w-40 overflow-hidden rounded-lg">
        <img 
          src="/logo.png" 
          alt="Talk N Type Logo" 
          className="h-full w-full object-contain"
        />
      </div>
      
      <div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight italic leading-none">
          
        </h1>
        <p className="text-[10px] font-bold text-sky-600 tracking-[0.2em] uppercase">
          
        </p>
      </div>
    </div>

    {/* BACK BUTTON */}
    <button 
      onClick={() => navigate('/dashboard')}
      className="text-xs font-black bg-gray-100 px-4 py-2 rounded-lg text-gray-500 hover:bg-sky-50 hover:text-sky-600 transition-all border border-gray-200"
    >
      BACK TO DASHBOARD
    </button>
  </div>
</div>

      {/* ================= 3. GRID BUTTONS ================= */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {dashboardItems.map((item, index) => (
            <button
              key={index}
              onClick={handleButtonClick}
              className={`
                ${item.color}
                py-5 px-4 rounded-xl shadow-md text-white
                text-[15px] font-black tracking-wide uppercase
                transition-all active:scale-95 duration-150
                flex items-center justify-center text-center
                border-b-4 border-opacity-50
              `}
            >
              {item.label}
            </button>
          ))}
          
          {/* History Button - Keeping it Neutral */}
         
        </div>
      </div>

      {/* ================= 4. UNDER UPDATION POPUP (MODAL) ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Under Updation</h2>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed">
              We are integrating new data and improving search features. This section will be live very soon!
            </p>
            <button 
              onClick={() => setShowModal(false)}
              className="w-full bg-sky-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-200 hover:bg-sky-700 active:scale-95 transition-all"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Custom Styles for Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default JudgementsPage;