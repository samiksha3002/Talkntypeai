
import React from 'react';

const HowItWorks = () => {
  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Section Header */}
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          How It Works
        </h2>
        <p className="text-lg text-slate-500 mb-16">
          Simple steps to get started with speech-to-text.
        </p>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          
          {/* Step 1 */}
          <StepItem 
            number="1"
            title="Speak"
            description="Click the microphone button and start speaking clearly."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            }
          />

          {/* Step 2 */}
          <StepItem 
            number="2"
            title="Transcribe"
            description="Our system processes your speech in real-time."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 13V4m7 7l9.282 9.282c-.522.127-1.1.205-1.7.205-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10c-.6 0-1.178-.078-1.7-.205L7 11z" />
              </svg>
            }
          />

          {/* Step 3 */}
          <StepItem 
            number="3"
            title="Get Text"
            description="Receive accurate, editable text instantly."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

        </div>
      </div>
    </section>
  );
};

// Reusable Single Step Component
const StepItem = ({ number, title, description, icon }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Gradient Icon Circle */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-blue-700 flex items-center justify-center shadow-lg mb-6 hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold text-slate-800 mb-3">
        {number}. {title}
      </h3>
      
      {/* Description */}
      <p className="text-slate-500 text-base leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
};

export default HowItWorks;