import React from 'react';
import DashboardNavbar from './DashboardNavbar';
import Sidebar from './Sidebar';
import Editor from './Editor';
import FooterButtons from './FooterButtons';

const Dashboard = () => {
  return (
    <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
      
      {/* --- TOP: NAVBAR --- */}
      {/* h-16: Space reserve karega */}
      <div className="flex-none z-50 h-16 w-full">
        <DashboardNavbar />
      </div>
      
      {/* --- MIDDLE: SIDEBAR + EDITOR --- */}
      <div className="flex flex-1 overflow-hidden relative"> 
        
        {/* Sidebar Left Side */}
        <Sidebar />
        
        {/* Editor Right Side */}
        {/* CHANGE: 'pb-2' add kiya hai. Isse Editor footer se thoda upar uthega */}
        {/* 'h-full' hata kar sirf 'flex-1' rakha hai taaki overflow na ho */}
        <main className="flex-1 ml-72 flex flex-col relative pb-2 min-h-0"> 
           <Editor />
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