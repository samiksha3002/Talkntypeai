// src/pages/ImportECourtPage.jsx
import React, { useState } from 'react';
import { ChevronLeft, RefreshCw, Upload, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportECourtPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select an eCourt text file to import.");
      return;
    }

    if (selectedFile.type !== 'text/plain') {
        alert("Only plain text files (.txt) from eCourt are supported for import.");
        return;
    }

    setIsProcessing(true);
    console.log(`Processing file: ${selectedFile.name}`);

    // --- Simulation of File Reading and Parsing ---
    // In a real application:
    // 1. Read the file contents (FileReader API).
    // 2. Parse the text (using Regex or string manipulation) to extract Case Name, Number, Date, etc.
    // 3. Call the backend API (POST /api/import-cases) with the extracted case objects.

    // Simulated API delay
    await new Promise(resolve => setTimeout(resolve, 3000)); 

    setIsProcessing(false);
    
    // Simulated result
    const simulatedCasesCount = Math.floor(Math.random() * 5) + 1; // 1 to 5 cases
    alert(`Import successful! ${simulatedCasesCount} cases were imported from ${selectedFile.name}.`);
    
    // Redirect to the dashboard or the Manage Cases page
    navigate('/manage-cases'); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center">
            <RefreshCw size={20} className="mr-2 text-purple-400" /> Import Cases (eCourt)
        </h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleImport} className="p-4 space-y-6">
        
        {/* Instructions */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Import Guidelines
            </h3>
            <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li><ArrowRight size={14} className="inline mr-1 text-purple-400" /> Download your case data as a **plain text file (.txt)** from the eCourt portal.</li>
                <li><ArrowRight size={14} className="inline mr-1 text-purple-400" /> The file must contain standard eCourt format data for successful parsing.</li>
                <li><ArrowRight size={14} className="inline mr-1 text-purple-400" /> Uploading a large file may take a few moments to process.</li>
            </ul>
        </div>
        
        {/* File Upload Input */}
        <div className="bg-slate-800 p-6 rounded-xl border border-dashed border-slate-600 hover:border-purple-500 transition cursor-pointer">
            <label htmlFor="ecourtFile" className="block text-center cursor-pointer">
                <div className="flex flex-col items-center justify-center">
                    <Upload size={40} className="text-purple-400 mb-3" />
                    {selectedFile ? (
                        <p className="text-base font-bold text-white">{selectedFile.name}</p>
                    ) : (
                        <p className="text-base font-bold text-slate-300">
                            Click to select eCourt Text File (.txt)
                        </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Maximum file size 5MB</p>
                </div>
            </label>
            <input
                type="file"
                id="ecourtFile"
                name="ecourtFile"
                accept=".txt" // Only accept text files
                onChange={handleFileChange}
                className="hidden" // Hide default file input
                disabled={isProcessing}
            />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full flex items-center justify-center py-3 font-bold rounded-xl shadow-lg transition duration-200 active:scale-98 
            ${selectedFile && !isProcessing ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
          `}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center">
                <RefreshCw size={20} className="mr-2 animate-spin" />
                Processing... Please wait
            </div>
          ) : (
            <>
                <FileText size={20} className="mr-2" />
                Start Import
            </>
          )}
        </button>
      </form>
      
    </div>
  );
};

export default ImportECourtPage;