import React from 'react';
import { useNavigate } from 'react-router-dom'; 

// ==========================================
// Helper Component for individual buttons
// ==========================================
const FooterButton = ({ icon, label, color, onClick, link }) => {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
    emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
  };

  const handleClick = () => {
    if (link) {
      window.open(link, '_blank');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-xl border font-bold text-base transition-all active:scale-95 shadow-sm whitespace-nowrap ${colorClasses[color] || colorClasses.slate}`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// ==========================================
// Main Footer Component
// ==========================================
const FooterButtons = () => {
  const navigate = useNavigate();

  // 1. Navigation for Business Card
  const handleBusinessCardClick = () => {
    console.log("Navigating to /business-card");
    navigate('/business-card');
  };

  // 2. Navigation for Judgements
  const handleJudgementsClick = () => {
    console.log("Navigating to /judgements");
    navigate('/judgements');
  };

  // 3. Navigation for Diary
  const handleDiaryClick = () => {
    console.log("Diary Button Clicked! Attempting to navigate to /diary");
    navigate('/diary'); 
  };

  // 4. Navigation for Create Website
const handleWebsiteClick = () => {
    console.log("Navigating to /create-website");
   navigate('/website-showcase');
  };

  return (
    <footer className="h-20 bg-white border-t border-gray-300 fixed bottom-0 w-full z-50 flex items-center justify-between px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* Left: System Status */}
      <div className="text-sm text-gray-500 font-medium items-center gap-2 hidden lg:flex min-w-[150px]">
         <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
         System Status: <span className="text-emerald-600 font-semibold">Online</span>
      </div>

      {/* CENTER: BUTTONS */}
      <div className="flex gap-3 w-full lg:w-auto lg:flex-1 justify-between items-center px-1">
        
        <FooterButton 
            icon="⚖️" 
            label="Judgements" 
            color="purple" 
            onClick={handleJudgementsClick}
        />

        <FooterButton 
            icon="🌐" 
            label="Website" 
            color="blue"  
            onClick={handleWebsiteClick} 
        />
        
        <FooterButton 
            icon="🪪" 
            label="Card" 
            color="orange" 
            onClick={handleBusinessCardClick} 
        />
        
        <FooterButton 
            icon="🏛️" 
            label="eCourt" 
            color="slate" 
            link="https://ecourts.gov.in/ecourts_home/" 
        />

        <FooterButton 
            icon="📒" 
            label="Diary" 
            color="emerald"
            onClick={handleDiaryClick} 
        />

      </div>

      {/* Right: Version */}
      <div className="text-xs text-gray-400 hidden lg:block min-w-[50px] text-right">
        v2.4.0
      </div>

    </footer>
  );
};

export default FooterButtons;