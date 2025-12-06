// src/pages/GenerateReportPage.jsx
import React, { useState } from 'react';
import { ChevronLeft, FileText, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const GenerateReportPage = () => {
  const navigate = useNavigate();
  
  // State to hold the date range for the report
  const [reportDates, setReportDates] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'), // Default to today
    endDate: format(new Date(), 'yyyy-MM-dd'),   // Default to today
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setReportDates({ ...reportDates, [name]: value });
  };

  const handleGeneratePDF = (e) => {
    e.preventDefault();
    
    const { startDate, endDate } = reportDates;

    if (!startDate || !endDate) {
      alert("Please select both a start date and an end date.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after the end date.");
        return;
    }

    console.log(`Generating PDF Report from ${startDate} to ${endDate}`);
    
    // In a real app, this function would:
    // 1. Fetch data from the API using the date range.
    // 2. Use a PDF library (like jsPDF or react-pdf) to format the data.
    // 3. Trigger the file download.
    
    // Simulation:
    alert(`Report generation for the period ${startDate} to ${endDate} initiated! File will download shortly.`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Generate Case Report (PDF)</h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleGeneratePDF} className="p-4 space-y-6">
        
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                <Calendar size={20} className="inline mr-2 text-red-400" /> Select Date Range
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={reportDates.startDate}
                        onChange={handleDateChange}
                        required
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-red-500 focus:border-red-500 text-white"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={reportDates.endDate}
                        onChange={handleDateChange}
                        required
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-red-500 focus:border-red-500 text-white"
                    />
                </div>
            </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition duration-200 active:scale-98"
        >
          <Download size={20} className="mr-2" />
          Generate & Download PDF
        </button>
      </form>
      
    </div>
  );
};

export default GenerateReportPage;