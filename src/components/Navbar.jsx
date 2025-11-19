import React from 'react';

const Navbar = () => {
  return (
    <nav className="w-full bg-white py-4 px-6 md:px-12 flex justify-between items-center shadow-sm z-50 relative">
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        {/* Simulating the blue icon from the image */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
          S
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-lg leading-none tracking-wide">SUPER STENO</span>
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

      {/* Mobile Menu Button (Visible only on small screens) */}
      <button className="md:hidden text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;