import React, { useState } from 'react';

const Contact = () => {
  const [result, setResult] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending....");
    const formData = new FormData(event.target);

    // --- REPLACE THIS WITH YOUR ACCESS KEY ---
    formData.append("access_key", "09589415-fa02-432a-a753-2fb71ffa1f23");

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setResult("Form Submitted Successfully!");
      event.target.reset();
    } else {
      console.log("Error", data);
      setResult(data.message);
    }
  };

  return (
    // Added id="contact-us" and scroll-mt-20 for your Navbar scroll to work
    <section id="contact-us" className="bg-white py-20 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          
          {/* Left Side: Contact Info */}
          <div className="text-left">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-500 mb-10 leading-relaxed">
              Have questions about our pricing, features, or need a custom solution? 
              Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="space-y-6">
              <ContactItem 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                title="Email Us"
                text="support@talkntype.com"
              />
              <ContactItem 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
                title="Call Us"
                text="Dhiraj Pardikar - +91 98235 99197"
              />
              <ContactItem 
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />}
                title="Visit Us"
                text="Mumbai, Maharashtra, India"
              />
            </div>
          </div>

          {/* Right Side: The Form */}
          <div className="bg-slate-50 p-8 rounded-2xl shadow-lg border border-slate-100">
            <form onSubmit={onSubmit} className="space-y-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name" // Important for Web3Forms
                  required
                  placeholder="John Doe" 
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  name="email" // Important for Web3Forms
                  required
                  placeholder="john@example.com" 
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea 
                  name="message" // Important for Web3Forms
                  required
                  rows="4" 
                  placeholder="How can we help you?" 
                  className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg transition duration-300 shadow-md"
              >
                Send Message
              </button>

              {/* Status Message */}
              <span className="block text-center text-sm font-medium text-slate-600 mt-2">{result}</span>

            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

const ContactItem = ({ icon, title, text }) => {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {icon}
        </svg>
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-slate-600 whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
};

export default Contact;