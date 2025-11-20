import React from 'react';

// ==========================================
// Helper Component for individual buttons
// ==========================================
const FooterButton = ({ icon, label, color }) => {
  // Define color schemes for Tailwind CSS
  const colorClasses = {
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    slate: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
    emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200",
  };

  return (
    // CHANGES: 
    // 1. 'flex-1': Taaki har button barabar width le.
    // 2. 'justify-center': Content center karne ke liye.
    // 3. 'py-3': Height badhane ke liye.
    // 4. 'text-base': Font bada karne ke liye.
    <button className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 rounded-xl border font-bold text-base transition-all active:scale-95 shadow-sm whitespace-nowrap ${colorClasses[color] || colorClasses.slate}`}>
      {/* Icon (Increased size to 2xl) */}
      <span className="text-2xl leading-none">{icon}</span>
      {/* Label (Visible on all screens now to fill space, or hide on very small mobile if needed) */}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

// ==========================================
// Main Footer Component
// ==========================================
const FooterButtons = () => {
  return (
    // Fixed Bottom Footer Container
    // h-20: Height thodi badha di taaki bade buttons fit ho sakein
    <footer className="h-20 bg-white border-t border-gray-300 fixed bottom-0 w-full z-50 flex items-center justify-between px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* Left: System Status (Hidden on mobile/tablet to give space to buttons) */}
      <div className="text-sm text-gray-500 font-medium items-center gap-2 hidden lg:flex min-w-[150px]">
         <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
         System Status: <span className="text-emerald-600 font-semibold">Online</span>
      </div>

      {/* CENTER: THE 5 MAIN BUTTONS */}
      {/* CHANGES: w-full aur max-w-none kar diya taaki ye puri jagah le */}
      <div className="flex gap-3 w-full lg:w-auto lg:flex-1 justify-between items-center px-1">
        
        <FooterButton icon="⚖️" label="Judgements" color="purple" />
        <FooterButton icon="🌐" label="Create Website" color="blue" />
        <FooterButton icon="🪪" label="Buisness Card" color="orange" />
        <FooterButton icon="🏛️" label="eCourt" color="slate" />
        <FooterButton icon="📒" label="Diary" color="emerald" />

      </div>

      {/* Right: Version (Hidden on mobile/tablet to give space to buttons) */}
      <div className="text-xs text-gray-400 hidden lg:block min-w-[50px] text-right">
        v2.4.0
      </div>

    </footer>
  );
};

export default FooterButtons; 