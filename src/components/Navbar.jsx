import React from 'react';

const Navbar = () => {
  return (
    // --- CHANGE 1: Fixed height (h-20) and Zero padding (py-0) ---
    <nav className="w-full bg-white h-20 py-0 px-6 md:px-12 flex justify-between items-center shadow-sm z-50 relative overflow-hidden">
      
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        
        {/* --- CHANGE 2: Negative Margin (-my-6) --- */}
        {/* '-my-6' image ke upar/niche ka extra space kha jayega */}
        <img 
          src="/logo.png" 
          alt="Talk N Type Logo" 
          className="w-48 h-auto object-contain -my-6" 
        />
        
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