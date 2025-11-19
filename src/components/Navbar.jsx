import React from 'react';

const Navbar = () => {
  return (
    <nav className="w-full bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm z-50 relative">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        
        {/* --- CHANGE START: Image Logo --- */}
        <img 
          src="/logo.png"  // Replace with your actual file name
          alt="Talk N Type Logo" 
          className="w-10 h-10 object-contain" 
        />
        {/* --- CHANGE END --- */}

        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-lg leading-none tracking-wide">Talk N Type</span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wider">Your Personal Virtual Assistant</span>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
        <li className="cursor-pointer hover:text-blue-600 transition">Home</li>
        <li className="cursor-pointer hover:text-blue-600 transition">Features</li>
        <li className="cursor-pointer hover:text-blue-600 transition">How it Works</li>
        <li className="cursor-pointer hover:text-blue-600 transition">Contact Us</li>
      </ul>

      {/* Mobile Menu Button */}
      <button className="md:hidden text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;