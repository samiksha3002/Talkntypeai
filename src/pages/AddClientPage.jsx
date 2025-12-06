// src/pages/AddClientPage.jsx
import React, { useState } from 'react';
import { ChevronLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddClientPage = () => {
  const navigate = useNavigate();
  
  // State to hold all client form data
  const [clientDetails, setClientDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientDetails({ ...clientDetails, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Client Details Submitted:", clientDetails);
    
    // In a real application, this is where you'd make an API call (POST /api/clients)
    alert(`Client ${clientDetails.fullName} added successfully (simulated)!`);
    
    // Clear the form and navigate back
    setClientDetails({ fullName: '', email: '', phone: '', address: '', city: '', notes: '' });
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add New Client</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">
            <User size={14} className="inline mr-1" /> Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={clientDetails.fullName}
            onChange={handleInputChange}
            placeholder="e.g., Ramesh Kumar"
            required
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>

        {/* Email & Phone (Grouped) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              <Mail size={14} className="inline mr-1" /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={clientDetails.email}
              onChange={handleInputChange}
              placeholder="client@example.com"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
              <Phone size={14} className="inline mr-1" /> Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={clientDetails.phone}
              onChange={handleInputChange}
              placeholder="+91-9876543210"
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>
        </div>
        
        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-1">
            <MapPin size={14} className="inline mr-1" /> Full Address
          </label>
          <textarea
            id="address"
            name="address"
            value={clientDetails.address}
            onChange={handleInputChange}
            placeholder="Street address, Colony, Pin Code"
            rows="2"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
          ></textarea>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={clientDetails.notes}
            onChange={handleInputChange}
            placeholder="Notes on client history or payment terms."
            rows="3"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition duration-200 active:scale-98"
        >
          <Save size={20} className="mr-2" />
          Save Client Details
        </button>
      </form>
      
    </div>
  );
};

export default AddClientPage;