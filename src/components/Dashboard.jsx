import React, { useState } from 'react'; 
import DashboardNavbar from './DashboardNavbar';
import Sidebar from './Sidebar'; // Ensure this path is correct
import Editor from './Editor';   // Ensure this path is correct
import FooterButtons from './FooterButtons';

const Dashboard = () => {
  // 1. State to hold the voice text
  const [voiceText, setVoiceText] = useState("");

  // 2. This function receives text from Sidebar
  const handleSpeechInput = (text) => {
    // --- DEBUG LOG: Check Console to see if this prints ---
    console.log("🟢 Dashboard Bridge Received:", text); 
    
    setVoiceText(text);
  };

  return (
    <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
      
      {/* --- TOP: NAVBAR --- */}
      <div className="flex-none z-50 h-16 w-full">
        <DashboardNavbar />
      </div>
      
      {/* --- MIDDLE: SIDEBAR + EDITOR --- */}
      <div className="flex flex-1 overflow-hidden relative"> 
        
        {/* Sidebar Left Side */}
        {/* We pass the handleSpeechInput function to Sidebar */}
        <Sidebar onSpeechInput={handleSpeechInput} />
        
        {/* Editor Right Side */}
        {/* ml-72 creates space for the fixed Sidebar */}
        <main className="flex-1 ml-72 flex flex-col relative pb-2 min-h-0"> 
            
            {/* We pass the voiceText state down to Editor */}
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