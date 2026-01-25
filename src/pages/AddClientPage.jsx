import React, { useState } from 'react';
import { ChevronLeft, User, Mail, Phone, MapPin, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddClientPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ✅ Use "name" instead of "fullName" to match backend schema
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientDetails({ ...clientDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const userId = localStorage.getItem('userId'); // Ensure this is saved during login

    if (!userId) {
      setError("User session not found. Please login again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://talkntypeai.onrender.com/api/clients/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...clientDetails, userId }),
      });

      if (response.ok) {
        alert("Client saved successfully!");
        navigate('/manage-clients'); // Redirect to list page
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save client.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="p-2 mr-2 text-slate-400 hover:text-white rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add New Client</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center text-red-400 text-sm">
            <AlertCircle size={16} className="mr-2" /> {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            <User size={14} className="inline mr-1 text-blue-400" /> Full Name
          </label>
          <input
            type="text"
            name="name"
            value={clientDetails.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Mail size={14} className="inline mr-1 text-blue-400" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={clientDetails.email}
              onChange={handleInputChange}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              <Phone size={14} className="inline mr-1 text-blue-400" /> Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={clientDetails.phone}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            <MapPin size={14} className="inline mr-1 text-blue-400" /> Address
          </label>
          <textarea
            name="address"
            value={clientDetails.address}
            onChange={handleInputChange}
            rows="2"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          ></textarea>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition active:scale-95 disabled:bg-slate-600"
        >
          <Save size={20} className="mr-2" /> {isSubmitting ? "Saving..." : "Save Client Details"}
        </button>
      </form>
    </div>
  );
};

export default AddClientPage;
