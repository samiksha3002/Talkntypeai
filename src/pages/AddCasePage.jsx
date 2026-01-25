// src/pages/AddCasePage.jsx
import React, { useState } from 'react';
import { ChevronLeft, Save, Briefcase, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddCasePage = () => {
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [caseDetails, setCaseDetails] = useState({
    caseName: '',
    caseNumber: '',
    courtName: '',
    hearingDate: '',
    description: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails({ ...caseDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const userId = localStorage.getItem('userId'); 
    if (!userId) {
      setError("User not authenticated. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('https://talkntypeai.onrender.com/api/cases/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...caseDetails,
          hearingDate: new Date(caseDetails.hearingDate), // ensure Date type
          userId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Case details saved successfully!");
        setCaseDetails({
          caseName: '',
          caseNumber: '',
          courtName: '',
          hearingDate: '',
          description: '',
        });
        navigate('/manage-cases'); // go to case list
      } else {
        setError(data.message || "Failed to save case.");
      }
    } catch (err) {
      console.error("Network error:", err);
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
          type="button" 
          onClick={() => navigate(-1)} 
          className="p-2 mr-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add New Case</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-center text-red-400 text-sm">
            <AlertCircle size={16} className="mr-2" />
            {error}
          </div>
        )}

        {/* Case Title */}
        <div>
          <label htmlFor="caseName" className="block text-sm font-medium text-slate-300 mb-1">
            <Briefcase size={14} className="inline mr-1 text-blue-400" /> Case Title / Parties
          </label>
          <input
            type="text"
            id="caseName"
            name="caseName"
            value={caseDetails.caseName}
            onChange={handleInputChange}
            placeholder="e.g., ABC vs. XYZ"
            required
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>

        {/* Case Number */}
        <div>
          <label htmlFor="caseNumber" className="block text-sm font-medium text-slate-300 mb-1">
            Case Number (Optional)
          </label>
          <input
            type="text"
            id="caseNumber"
            name="caseNumber"
            value={caseDetails.caseNumber}
            onChange={handleInputChange}
            placeholder="e.g., SLP (C) 1234/2025"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
          />
        </div>
        
        {/* Court Name & Hearing Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="courtName" className="block text-sm font-medium text-slate-300 mb-1">
              Court Name
            </label>
            <input
              type="text"
              id="courtName"
              name="courtName"
              value={caseDetails.courtName}
              onChange={handleInputChange}
              placeholder="e.g., High Court of Bombay"
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
            />
          </div>
          <div>
            <label htmlFor="hearingDate" className="block text-sm font-medium text-slate-300 mb-1">
              <Calendar size={14} className="inline mr-1 text-green-400" /> Next Hearing Date
            </label>
            <input
              type="date"
              id="hearingDate"
              name="hearingDate"
              value={caseDetails.hearingDate}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
            <FileText size={14} className="inline mr-1 text-blue-400" /> Notes / Details
          </label>
          <textarea
            id="description"
            name="description"
            value={caseDetails.description}
            onChange={handleInputChange}
            placeholder="Brief facts, required documents, or next steps."
            rows="3"
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center py-3 font-bold rounded-xl shadow-lg transition 
            ${isSubmitting 
              ? 'bg-slate-600 cursor-not-allowed text-slate-300' 
              : 'bg-green-600 hover:bg-green-700 text-white active:scale-98'
            }`}
        >
          {isSubmitting ? "Saving..." : (<><Save size={20} className="mr-2" /> Save Case Details</>)}
        </button>
      </form>
    </div>
  );
};

export default AddCasePage;
