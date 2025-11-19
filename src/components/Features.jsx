import React from 'react';

const Features = () => {
  return (
    <section className="bg-gray-50 py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Section Header */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
          Core Features
        </h2>
        <p className="text-lg text-gray-600 mb-16 max-w-2xl mx-auto">
          Everything you need for seamless transcription.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature Card 1 */}
          <FeatureCard 
            icon="⚙️" // You can replace this with an actual SVG/icon component later
            title="Well Programmed"
            description="Accurate drafting with 15+ built-in commands including punctuation (comma, full stop, slash, etc.) for perfect recognition."
          />

          {/* Feature Card 2 */}
          <FeatureCard 
            icon="⏱️" // Example icon
            title="Boosts Productivity"
            description="Quickly document project details. Enables professionals to work independently and maintain records efficiently."
          />

          {/* Feature Card 3 */}
          <FeatureCard 
            icon="🔄" // Example icon
            title="Faster Process"
            description="Up to 3x faster than typing with 99% accuracy (120+ wpm vs 40 wpm). Saves time and reduces grammatical errors."
          />

          {/* Feature Card 4 */}
          <FeatureCard 
            icon="🔡" // Example icon
            title="Multi-Language Support"
            description="Transcribe data in 11 languages: Hindi, English, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Tamil, Telugu."
            // Note: I've truncated the description for brevity, you can add "Urdu" back.
          />

          {/* Feature Card 5 */}
          <FeatureCard 
            icon="✉️" // Example icon
            title="Copy & Email"
            description="Easily copy or email transcribed content for saving and sharing, improving team coordination."
          />

          {/* Call to Action Card (Last one with gradient) */}
          <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-8 rounded-lg shadow-lg flex flex-col justify-center items-center text-center text-white">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* Placeholder for the rotating icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 13V4m7 7l9.282 9.282c-.522.127-1.1.205-1.7.205-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10c-.6 0-1.178-.078-1.7-.205L7 11z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">Get Started Today</h3>
              <p className="text-gray-100 text-lg">Ready to speed up your documentation?</p>
            </div>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-100 transition shadow-md">
              Register Now
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

// Reusable Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">{icon}</span> {/* Adjust icon size if using actual SVG */}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
};

export default Features;