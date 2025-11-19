import React from 'react';
import { Link } from 'react-router-dom'; // <--- Added this import

const Hero = () => {
  return (
    <div className="relative w-full min-h-[90vh] bg-slate-800 flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      
      {/* Background Effect (Simulating the dark gradient overlay) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 to-slate-800/90 z-10"></div>
      
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589254065878-42c9da9e2573?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 z-0"></div>

      {/* Main Content */}
      <div className="relative z-20 max-w-5xl mx-auto mt-[-50px]">
        
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
          Welcome to SuperSteno, <br />
          An AI Based Advanced <br />
          Tool for Documentation
        </h1>

        {/* Subheadline */}
        <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 font-light">
          Speech to Text, AI Correction, AI Expansion, Audio to Text, Image to Text : All at One Place
        </p>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 text-sm md:text-base text-gray-200 font-medium">
          <FeatureItem icon="⚡" text="Faster Than Typing" />
          <FeatureItem icon="🌐" text="11+ Languages" />
          <FeatureItem icon="✅" text="High Accuracy" />
          <FeatureItem icon="🔗" text="Easy Sharing" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Sign In Button (Updated to Link) */}
          <Link 
            to="/login" 
            className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-10 py-3 rounded text-lg font-semibold transition shadow-lg inline-block text-center"
          >
            Sign In
          </Link>

          {/* Register Button */}
         <Link to="/register" className="bg-transparent border border-gray-400 hover:border-white text-white px-10 py-3 rounded text-lg font-semibold transition hover:bg-white/10 inline-block text-center">
    Register
</Link>
        </div>

      </div>
    </div>
  );
};

// Helper Component for the small feature items
const FeatureItem = ({ icon, text }) => (
  <div className="flex items-center gap-2">
    <span className="text-teal-400 bg-teal-400/10 p-1 rounded-full text-xs md:text-sm">{icon}</span>
    <span>{text}</span>
  </div>
);

export default Hero;