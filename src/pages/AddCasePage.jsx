// src/pages/AddCasePage.jsx
import React, { useState } from 'react';
import { ChevronLeft, Save, Briefcase, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddCasePage = () => {
  const navigate = useNavigate();
  
  // State to hold all case form data
  const [caseDetails, setCaseDetails] = useState({
    caseName: '',
    caseNumber: '',
    courtName: '',
    hearingDate: '',
    description: '',
  });

  // Handler for updating state on input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCaseDetails({ ...caseDetails, [name]: value });
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Case Details Submitted:", caseDetails);
    
    // --- API/Backend Logic goes here ---
    // In a real app, you would send caseDetails to your API server.
    
    alert("Case details saved successfully (simulated)!");
    
    // Clear the form and navigate back to the dashboard/diary
    setCaseDetails({
        caseName: '',
        caseNumber: '',
        courtName: '',
        hearingDate: '',
        description: '',
    });
    navigate('/'); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add New Case</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        
        {/* Case Title / Parties */}
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
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
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
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
          />
        </div>
        
        {/* Court Name & Hearing Date (Grouped) */}
        <div className="grid grid-cols-2 gap-4">
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
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
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
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
            />
          </div>
        </div>

        {/* Description / Notes */}
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
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition duration-200 active:scale-98"
        >
          <Save size={20} className="mr-2" />
          Save Case Details
        </button>
      </form>
      
    </div>
  );
};

export default AddCasePage;