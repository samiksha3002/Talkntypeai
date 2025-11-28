import React, { useState } from 'react'; // 1. useState import kiya
import DashboardNavbar from './DashboardNavbar';
import Sidebar from './Sidebar';
import Editor from './Editor';
import FooterButtons from './FooterButtons';

const Dashboard = () => {
  // 2. State banayi jo aawaz wala text hold karegi
  const [voiceText, setVoiceText] = useState("");

  return (
    <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
      
      {/* --- TOP: NAVBAR --- */}
      <div className="flex-none z-50 h-16 w-full">
        <DashboardNavbar />
      </div>
      
      {/* --- MIDDLE: SIDEBAR + EDITOR --- */}
      <div className="flex flex-1 overflow-hidden relative"> 
        
        {/* Sidebar Left Side */}
        {/* 3. Sidebar ko function diya: "Jab koi bole, toh setVoiceText ko call karna" */}
        <Sidebar onSpeechInput={(text) => setVoiceText(text)} />
        
        {/* Editor Right Side */}
        <main className="flex-1 ml-72 flex flex-col relative pb-2 min-h-0"> 
            {/* 4. Editor ko text pass kiya: "Ye lo text, ise textarea me dikhao" */}
            <Editor speechText={voiceText} />
        </main>
      </div>

      {/* --- BOTTOM: GLOBAL FOOTER --- */}
      <div className="flex-none w-full bg-white border-t border-gray-200 z-50">
         <FooterButtons />
      </div>

    </div>
  );
};

export default Dashboard;