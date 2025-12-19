// src/pages/AddInquiryPage.jsx
import React, { useState } from 'react';
import { ChevronLeft, User, Phone, Mail, FileText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddInquiryPage = () => {
  const navigate = useNavigate();

  // State to hold inquiry data
  const [inquiryDetails, setInquiryDetails] = useState({
    inquirerName: '',
    contactNumber: '',
    email: '',
    typeOfCase: '',
    summary: '',
    followUpDate: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInquiryDetails({ ...inquiryDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Use import.meta.env for Vite
      const API_URL = import.meta.env.VITE_API_URL;

      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token") || ""}` // Added Auth if required by your backend
        },
        body: JSON.stringify(inquiryDetails),
      });

      if (!res.ok) {
        throw new Error('Failed to save inquiry');
      }

      const data = await res.json();
      alert(`New Inquiry from ${data.inquiry.inquirerName} saved!`);

      // Clear the form
      setInquiryDetails({
        inquirerName: '',
        contactNumber: '',
        email: '',
        typeOfCase: '',
        summary: '',
        followUpDate: '',
      });

      // ✅ Changed from navigate('/') to navigate('/diary')
      navigate('/diary');
    } catch (err) {
      alert('Error saving inquiry: ' + err.message);
    } finally {
      setLoading(false);
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
        <h1 className="text-xl font-bold">Add New Inquiry / Lead</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Contact Details Section */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <User size={20} className="inline mr-2 text-orange-400" /> Inquirer Information
          </h3>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="inquirerName"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="inquirerName"
                name="inquirerName"
                value={inquiryDetails.inquirerName}
                onChange={handleInputChange}
                placeholder="Inquirer's Name"
                required
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
              />
            </div>
            {/* Phone & Email (Grouped) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  <Phone size={14} className="inline mr-1" /> Phone
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={inquiryDetails.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Contact Number"
                  required
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  <Mail size={14} className="inline mr-1" /> Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={inquiryDetails.email}
                  onChange={handleInputChange}
                  placeholder="Email Address"
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Details Section */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
            <FileText size={20} className="inline mr-2 text-orange-400" /> Matter Details
          </h3>
          <div className="space-y-4">
            {/* Type of Case */}
            <div>
              <label
                htmlFor="typeOfCase"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Type of Inquiry/Case
              </label>
              <input
                type="text"
                id="typeOfCase"
                name="typeOfCase"
                value={inquiryDetails.typeOfCase}
                onChange={handleInputChange}
                placeholder="e.g., Property Dispute, Divorce, Commercial"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
              />
            </div>
            {/* Summary */}
            <div>
              <label
                htmlFor="summary"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Summary of Inquiry / Issue
              </label>
              <textarea
                id="summary"
                name="summary"
                value={inquiryDetails.summary}
                onChange={handleInputChange}
                placeholder="Brief facts and specific client request."
                rows="3"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
              ></textarea>
            </div>
            {/* Follow-up Date */}
            <div>
              <label
                htmlFor="followUpDate"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Next Follow-up Date
              </label>
              <input
                type="date"
                id="followUpDate"
                name="followUpDate"
                value={inquiryDetails.followUpDate}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition duration-200 active:scale-95 disabled:opacity-50"
        >
          <Save size={20} className="mr-2" />
          {loading ? 'Saving...' : 'Save Inquiry'}
        </button>
      </form>
    </div>
  );
};

export default AddInquiryPage;