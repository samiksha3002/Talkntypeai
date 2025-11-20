import React from 'react';
import { Link } from 'react-router-dom';

const DashboardNavbar = () => {
  return (
    <nav className="w-full bg-white h-16 flex items-center justify-between px-4 border-b border-gray-200 fixed top-0 z-50">
      
      {/* Left: Logo & Hide Button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          
          {/* --- UPDATED LOGO STYLE (From Home Screen) --- */}
          {/* Replaced small icon + text with the large logo image style */}
          <img 
            src="/logo.png" 
            alt="Talk N Type Logo" 
            className="w-48 h-auto object-contain -my-6" 
          />
          
        </div>
        
        
      </div>

      {/* Right: Info & Logout */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>License: 8 months Remaining</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📞</span>
          <span>Enquiry: +91-7678073260</span>
        </div>
        
        <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 transition shadow-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </Link>
      </div>

    </nav>
  );
};

export default DashboardNavbar;