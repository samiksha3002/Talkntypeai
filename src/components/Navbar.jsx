import React from 'react';

const Navbar = () => {
  // Helper function to handle smooth scroll
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="w-full bg-white h-20 py-0 px-6 md:px-12 flex justify-between items-center shadow-sm z-50 fixed top-0 left-0">
      
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <img 
          src="/logo.png" 
          alt="Talk N Type Logo" 
          className="w-48 h-auto object-contain -my-6 cursor-pointer"
          onClick={() => scrollToSection('hero')} // Optional: scroll to top on logo click
        />
      </div>

      {/* Navigation Links */}
      <ul className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
        <li onClick={() => scrollToSection('home')} className="cursor-pointer hover:text-blue-600 transition">Home</li>
        <li onClick={() => scrollToSection('features')} className="cursor-pointer hover:text-blue-600 transition">Features</li>
        <li onClick={() => scrollToSection('how-it-works')} className="cursor-pointer hover:text-blue-600 transition">How it Works</li>
        {/* Contact Us Trigger */}
        <li onClick={() => scrollToSection('contact')} className="cursor-pointer hover:text-blue-600 transition">Contact Us</li>
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