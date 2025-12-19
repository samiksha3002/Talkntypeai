import React, { useState } from 'react';
import { ChevronLeft, RefreshCw, Upload, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ImportECourtPage = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current user from localStorage to pass the userId
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user._id || user.id;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      setSelectedFile(file);
    } else {
      alert("Please upload a valid .txt file.");
      e.target.value = null;
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select an eCourt text file to import.");
      return;
    }

    if (!userId) {
      alert("User not authenticated. Please log in again.");
      return;
    }

    setIsProcessing(true);

    // 1. Initialize FileReader to read the file as text
    const reader = new FileReader();

    reader.onload = async (event) => {
      const textContent = event.target.result;

      try {
        const API_URL = import.meta.env.VITE_API_URL;

        // 2. Call the real backend API
        const res = await fetch(`${API_URL}/api/cases/import`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token") || ""}`
          },
          body: JSON.stringify({ 
            userId: userId, 
            textData: textContent 
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          alert(`Import successful! ${data.count} cases were imported.`);
          navigate('/manage-cases'); 
        } else {
          alert(data.message || "Failed to parse file. Ensure it is a valid eCourt text export.");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("An error occurred while connecting to the server.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      alert("Failed to read the file.");
      setIsProcessing(false);
    };

    // Start reading the file
    reader.readAsText(selectedFile);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center p-4 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate(-1)} className="p-2 mr-2 text-slate-400 hover:text-white rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center">
            <RefreshCw size={20} className={`mr-2 text-purple-400 ${isProcessing ? 'animate-spin' : ''}`} /> 
            Import Cases (eCourt)
        </h1>
      </div>

      {/* Form Area */}
      <form onSubmit={handleImport} className="p-4 space-y-6">
        
        {/* Instructions */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Import Guidelines
            </h3>
            <ul className="text-sm text-slate-400 space-y-2 list-none">
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-purple-400 shrink-0" /> 
                  Download your case data as a **plain text file (.txt)** from the eCourt portal.
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-purple-400 shrink-0" /> 
                  The file must contain standard eCourt format data (Case No, Party Names, etc).
                </li>
                <li className="flex items-start">
                  <ArrowRight size={14} className="mr-2 mt-1 text-purple-400 shrink-0" /> 
                  Once imported, you can find your cases in the **Manage Cases** section.
                </li>
            </ul>
        </div>
        
        {/* File Upload Input */}
        <div className={`bg-slate-800 p-6 rounded-xl border border-dashed transition cursor-pointer ${selectedFile ? 'border-purple-500 bg-purple-500/5' : 'border-slate-600 hover:border-purple-500'}`}>
            <label htmlFor="ecourtFile" className="block text-center cursor-pointer">
                <div className="flex flex-col items-center justify-center">
                    <Upload size={40} className={`${selectedFile ? 'text-purple-300' : 'text-purple-400'} mb-3`} />
                    {selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-base font-bold text-white">{selectedFile.name}</p>
                          <p className="text-xs text-purple-400">File selected successfully</p>
                        </div>
                    ) : (
                        <p className="text-base font-bold text-slate-300">
                            Click to select eCourt Text File (.txt)
                        </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">Maximum file size 5MB</p>
                </div>
            </label>
            <input
                type="file"
                id="ecourtFile"
                name="ecourtFile"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
            />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full flex items-center justify-center py-3 font-bold rounded-xl shadow-lg transition duration-200 active:scale-95 
            ${selectedFile && !isProcessing ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
          `}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center">
                <RefreshCw size={20} className="mr-2 animate-spin" />
                Parsing File...
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