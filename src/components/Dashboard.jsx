import React, { useState, useCallback } from 'react'; 
import DashboardNavbar from './DashboardNavbar';
import Sidebar from './Sidebar'; 
import Editor from './Editor'; 
import FooterButtons from './FooterButtons';

const Dashboard = () => {
  // 1. State to hold the text coming from the Sidebar
  const [voiceText, setVoiceText] = useState("");

  // 2. The Bridge Function (Optimized with useCallback)
  // This ensures the Sidebar doesn't re-render unnecessarily
  const handleSpeechInput = useCallback((text) => {
    console.log("🟢 Bridge Active - Text Received:", text);
    setVoiceText(text);
  }, []);

  return (
    <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
      
      {/* --- TOP: NAVBAR --- */}
      <div className="flex-none z-50 h-16 w-full shadow-sm">
        <DashboardNavbar />
      </div>
      
      {/* --- MIDDLE: WORKSPACE --- */}
      <div className="flex flex-1 overflow-hidden relative"> 
        
        {/* LEFT: Sidebar (The Microphone) */}
        {/* We pass the function DOWN so Sidebar can call it */}
        <Sidebar onSpeechInput={handleSpeechInput} />
        
        {/* RIGHT: Editor (The Text Box) */}
        {/* ml-72 creates the empty space for the fixed Sidebar */}
        <main className="flex-1 ml-72 flex flex-col relative h-full"> 
            
            {/* We pass the voiceText state DOWN to Editor */}
            <Editor speechText={voiceText} />
            
        </main>
      </div>

      {/* --- BOTTOM: FOOTER --- */}
      <div className="flex-none w-full bg-white border-t border-gray-200 z-50">
         <FooterButtons />
      </div>

    </div>
  );
};

export default Dashboard;