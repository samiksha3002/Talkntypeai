import React from 'react';
import DashboardNavbar from './DashboardNavbar';
import Sidebar from './Sidebar';
import Editor from './Editor';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <DashboardNavbar />
      
      <div className="pt-16 flex"> {/* pt-16 to account for fixed navbar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="ml-72 flex-1 h-[calc(100vh-64px)]">
          <Editor />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;