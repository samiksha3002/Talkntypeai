import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
          onClick={() => scrollToSection('hero-section')} // Hero पर जाने के लिए
        />
      </div>

      {/* Navigation Links */}
      <ul className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
        <li onClick={() => scrollToSection('hero-section')} className="cursor-pointer hover:text-blue-600 transition">Home</li>
        <li onClick={() => scrollToSection('features-section')} className="cursor-pointer hover:text-blue-600 transition">Features</li>
        <li onClick={() => scrollToSection('testimonials-section')} className="cursor-pointer hover:text-blue-600 transition">Testimonials</li>
        <li onClick={() => scrollToSection('contact-section')} className="cursor-pointer hover:text-blue-600 transition">Contact Us</li>
      </ul>

      {/* Right Side: Buttons */}
      <div className="hidden md:flex items-center gap-4">
        <Link to="/login" className="text-gray-700 hover:text-blue-600 px-4 py-2 font-semibold text-sm transition">
          Sign In
        </Link>
        <Link to="/register" className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-6 py-2 rounded-full font-semibold text-sm transition shadow-md active:scale-95">
          Register
        </Link>
      </div>

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