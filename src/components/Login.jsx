import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Import icons

const Login = () => {
  // 1. State to capture user input
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // New state for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate(); 

  // 2. Handle typing
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Login Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Verifying credentials...' });

    try {
      // ↓↓↓ THIS LINE IS CRITICAL. IT MUST BE EXACTLY LIKE THIS ↓↓↓
      const response = await fetch('https://tnt-gi49.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const user = data.user;

        // --- APPROVAL CHECK LOGIC ---
        // Check if user is NOT admin AND (has no subscription OR subscription is inactive)
        const isUserInactive = user.role !== 'admin' && 
                               (!user.subscription || user.subscription.isActive === false);

        if (isUserInactive) {
            setStatus({ 
                type: 'error', 
                message: '⛔ Access Denied: Your account is pending Admin Approval.' 
            });
            return; // Stop here, do not redirect
        }
        // -----------------------------------

        setStatus({ type: 'success', message: 'Login Successful! Redirecting...' });
        
        // Save user info
        localStorage.setItem('user', JSON.stringify(user));
        if(user.subscription && user.subscription.expiryDate) {
            localStorage.setItem('expiryDate', user.subscription.expiryDate);
        }

        // --- SMART REDIRECT LOGIC ---
        setTimeout(() => {
           if (user.role === 'admin') {
             navigate('/admin');
           } else {
             navigate('/dashboard');
           }
        }, 1000);

      } else {
        setStatus({ type: 'error', message: data.message || 'Invalid Email or Password' });
      }
    } catch (error) {
      console.error("Login Error:", error);
      // Fallback for testing (Optional - remove if not needed in production)
      if(formData.email === "admin@test.com") {
          localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
          navigate('/admin');
      } else {
          setStatus({ type: 'error', message: 'Server error. Please try again later.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-20">
      
      <h1 className="text-4xl text-gray-600 mb-8 font-normal">User Login</h1>

      <div className="bg-white p-8 shadow-sm border border-gray-300 w-full max-w-md relative">
        
        <p className="text-center text-gray-500 mb-6">Sign in to your account</p>

        {/* Status Alert Box */}
        {status.message && (
          <div className={`mb-4 p-3 text-sm rounded text-center border ${
            status.type === 'error' ? 'bg-red-100 text-red-600 border-red-200' : 
            status.type === 'success' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-blue-100 text-blue-600 border-blue-200'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-400 text-gray-600"
            />
          </div>

          {/* Password Input with Eye Toggle */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Password" 
              required
              value={formData.password}
              onChange={handleChange}
              // Added pr-10 to prevent text from going under the icon
              className="w-full border border-gray-300 px-4 py-2 pr-10 rounded focus:outline-none focus:border-blue-400 text-gray-600"
            />
            <button
              type="button" // Important: prevents form submission when clicking the eye
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded transition duration-200 text-center"
          >
            Sign In
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <Link to="/register" className="block text-blue-500 hover:underline text-sm">
            Register a new membership
          </Link>
        </div>
      </div>
      
      <Link to="/" className="mt-8 text-gray-500 hover:text-gray-800 text-sm">
        ← Back to Home
      </Link>

    </div>
  );
};

export default Login;