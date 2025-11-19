import React from 'react';
import { Link } from 'react-router-dom'; // We use this for links

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-20">
      
      {/* Page Header */}
      <h1 className="text-4xl text-gray-600 mb-8 font-normal">User Login</h1>

      {/* Login Card */}
      <div className="bg-white p-8 shadow-sm border border-gray-300 w-full max-w-md">
        
        <p className="text-center text-gray-500 mb-6">Sign in to your account</p>

        <form className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-400 text-gray-600"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              {/* Envelope Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </span>
          </div>

          {/* Password Input */}
          <div className="relative">
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-400 text-gray-600"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              {/* Lock Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
          </div>

          {/* Sign In Button */}
         {/* Replace the <button>Sign In</button> with this: */}
<Link to="/dashboard" className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded transition duration-200 text-center">
  Sign In
</Link>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <Link to="/register" className="block text-blue-500 hover:underline text-sm">
    Register a new membership
</Link>
          <a href="#" className="block text-gray-500 hover:underline text-sm">
            Admin Login
          </a>
        </div>
      </div>
      
      {/* Back to Home Link (Optional, so you don't get stuck) */}
      <Link to="/" className="mt-8 text-gray-500 hover:text-gray-800 text-sm">
        ← Back to Home
      </Link>

    </div>
  );
};

export default Login;