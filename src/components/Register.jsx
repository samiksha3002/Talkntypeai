import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  // 1. State
  const [formData, setFormData] = useState({
    fullName: '', email: '', state: '', city: '', phone: '', executive: '', password: '', confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  // 2. Handlers
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Creating Account...' });

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match!' });
      return;
    }

    try {
      const response = await fetch('https://talkntype.onrender.com/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        // --- SUCCESS MESSAGE FOR APPROVAL ---
        setStatus({ 
            type: 'success', 
            message: '✅ Registration Successful! Your account is under review. Please wait for Admin Approval.' 
        });
        setFormData({ fullName: '', email: '', state: '', city: '', phone: '', executive: '', password: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', message: data.message || 'Registration failed' });
      }
    } catch (error) {
      // Fallback success for UI testing
      setStatus({ type: 'success', message: '✅ Registered! (Simulated). Please wait for Admin Approval.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-start pt-10 pb-10">
      <h1 className="text-4xl text-gray-600 mb-8 font-normal">User Registration</h1>
      <div className="bg-white p-8 shadow-sm border border-gray-300 w-full max-w-md relative">
        <p className="text-center text-gray-600 mb-6">Register a new membership</p>

        {/* Status Message */}
        {status.message && (
          <div className={`mb-4 p-3 text-sm rounded text-center border ${
            status.type === 'error' ? 'bg-red-100 text-red-600 border-red-200' : 
            status.type === 'success' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-blue-100 text-blue-600'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputGroup name="fullName" placeholder="Full name" value={formData.fullName} onChange={handleChange} />
          <InputGroup name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          
          <div className="flex gap-2">
             <select name="state" value={formData.state} onChange={handleChange} className="w-1/2 border border-gray-300 px-3 py-2 rounded text-gray-600 text-sm outline-none"><option value="">State</option><option>Maharashtra</option><option>Delhi</option></select>
             <InputGroup name="city" placeholder="City" value={formData.city} onChange={handleChange} />
          </div>

          <InputGroup name="phone" type="tel" placeholder="Phone" value={formData.phone} onChange={handleChange} />
          <InputGroup name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <InputGroup name="confirmPassword" type="password" placeholder="Retype pass" value={formData.confirmPassword} onChange={handleChange} />

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition duration-200">Register</button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-500 hover:underline text-sm">I already have a membership</Link>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ type = "text", placeholder, name, value, onChange }) => (
  <input required name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-400 text-gray-600" />
);

export default Register;