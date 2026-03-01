import React, { useState } from "react";

const ReviewDraft = ({ onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-2xl w-full mx-4 relative transform transition-all animate-scale-up">
        
        {/* Close Button */}
        <button onClick={onBack} className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-2xl">✕</button>

        {/* Header */}
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Upload your draft</h2>
        <p className="text-gray-500 mb-8 leading-relaxed font-medium">
          After uploading, you can tell Talk N Type to proofread, make your grammar better etc. TNT will track all changes made.
        </p>

        {/* Drop Zone (Matches your Screenshot) */}
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-[24px] p-16 transition-all flex flex-col items-center justify-center ${
            dragActive ? "border-indigo-600 bg-indigo-50/50" : "border-indigo-100 bg-slate-50/30"
          }`}
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl mb-4 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <p className="text-gray-600 font-bold mb-1">
            {selectedFile ? selectedFile.name : "Drag & Drop to Upload Word File"}
          </p>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">OR</p>

          <input type="file" id="file-upload" hidden accept=".docx,.doc" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <label 
            htmlFor="file-upload"
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:shadow-md transition-all cursor-pointer"
          >
            Browse File
          </label>
        </div>

        {/* Footer Actions */}
        <div className="mt-10 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-500 font-bold hover:text-gray-700">Cancel</button>
          <button 
            disabled={!selectedFile}
            className={`px-10 py-3 rounded-xl font-bold transition-all shadow-lg ${
              selectedFile ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewDraft;