import React from 'react';

const Testimonials = () => {
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        
        {/* Section Header */}
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          What Our Users Say
        </h2>
        <p className="text-lg text-slate-500 mb-16 max-w-2xl mx-auto">
          Join thousands of professionals who trust SuperSteno for their documentation needs.
        </p>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* User 1 */}
          <TestimonialCard 
            name="Sarah Jenkins"
            role="Content Creator"
            image="https://randomuser.me/api/portraits/women/44.jpg"
            text="SuperSteno has completely changed how I write my scripts. The accuracy in English and Hindi is mind-blowing. I save hours every week!"
          />

          {/* User 2 */}
          <TestimonialCard 
            name="Rahul Verma"
            role="Journalist"
            image="https://randomuser.me/api/portraits/men/32.jpg"
            text="As a journalist, I need quick transcriptions. This tool is faster than manual typing and the punctuation command feature is a lifesaver."
          />

          {/* User 3 */}
          <TestimonialCard 
            name="Priya Sharma"
            role="Medical Student"
            image="https://randomuser.me/api/portraits/women/68.jpg"
            text="I use it to take notes during lectures. The multi-language support helps me capture everything accurately. Highly recommended!"
          />

        </div>
      </div>
    </section>
  );
};

// Reusable Card Component
const TestimonialCard = ({ name, role, image, text }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 text-left flex flex-col h-full">
      
      {/* Stars */}
      <div className="flex text-yellow-400 mb-4">
        {[...Array(5)].map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Review Text */}
      <p className="text-slate-600 mb-6 italic flex-grow">"{text}"</p>

      {/* User Profile */}
      <div className="flex items-center mt-auto">
        <img 
          src={image} 
          alt={name} 
          className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 mr-4"
        />
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;