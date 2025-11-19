import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-10 pb-10">
      
      {/* Page Header */}
      <h1 className="text-4xl text-gray-600 mb-8 font-normal">User Registration</h1>

      {/* Registration Card */}
      <div className="bg-white p-8 shadow-sm border border-gray-300 w-full max-w-md">
        
        <p className="text-center text-gray-600 mb-6">Register a new membership</p>

        <form className="space-y-4">
          
          {/* Full Name */}
          <InputGroup placeholder="Full name" type="text" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          } />

          {/* Email */}
          <InputGroup placeholder="Email" type="email" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
          } />

           {/* State Dropdown */}
           <div className="relative">
            <select className="w-full border border-gray-300 px-4 py-2 rounded text-gray-600 focus:outline-none focus:border-blue-400 appearance-none bg-white">
              <option>-- Select State --</option>
              <option>Maharashtra</option>
              <option>Delhi</option>
              <option>Karnataka</option>
              <option>Gujarat</option>
            </select>
             <span className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">
              {/* Map Marker Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            </span>
          </div>

          {/* City */}
          <InputGroup placeholder="City" type="text" icon={
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>
          } />

          {/* Phone */}
          <InputGroup placeholder="Phone" type="tel" icon={
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
          } />
          
           {/* Executive (Optional) */}
           <InputGroup placeholder="Executive (Optional)" type="text" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          } />

          {/* Password */}
          <InputGroup placeholder="Password" type="password" icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          } />

          {/* Retype Password */}
          <InputGroup placeholder="Retype password" type="password" icon={
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          } />

          {/* Register Button */}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition duration-200">
            Register
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-500 hover:underline text-sm">
            I already have a membership
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper Component for cleaner code
const InputGroup = ({ type, placeholder, icon }) => (
  <div className="relative">
    <input 
      type={type} 
      placeholder={placeholder} 
      className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-400 text-gray-600"
    />
    <span className="absolute right-3 top-2.5 text-gray-500">
      {icon}
    </span>
  </div>
);

export default Register;