import React, { useState } from "react";

const UploadDraft = ({ onBack }) => {
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
        
        {/* Close Icon Button */}
        <button 
          onClick={onBack} 
          className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Upload your draft</h2>
          <p className="text-gray-500 leading-relaxed font-medium">
            Upload Your Draft and Make Changes as per your wish.
          </p>
        </div>

        {/* Upload Container / Drop Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-[24px] py-20 px-10 transition-all flex flex-col items-center justify-center ${
            dragActive 
            ? "border-indigo-600 bg-indigo-50/50 scale-[1.02]" 
            : "border-indigo-100 bg-slate-50/30"
          }`}
        >
          {/* Upload Icon with Gradient Background */}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-sm">
             <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
          </div>

          <p className="text-gray-600 font-bold text-lg mb-1">
            {selectedFile ? selectedFile.name : "Drag & Drop to Upload Word File"}
          </p>
          
          {!selectedFile && (
            <>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] my-4">OR</p>
              
              <input 
                type="file" 
                id="word-upload" 
                hidden 
                accept=".docx,.doc" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
              />
              <label 
                htmlFor="word-upload"
                className="px-10 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer active:scale-95"
              >
                Browse File
              </label>
            </>
          )}

          {selectedFile && (
            <button 
              onClick={() => setSelectedFile(null)} 
              className="mt-4 text-xs font-bold text-red-500 hover:underline uppercase tracking-widest"
            >
              Remove File
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase tracking-widest text-sm"
          >
            Cancel
          </button>
          
          <button 
            disabled={!selectedFile}
            className={`px-12 py-4 rounded-2xl font-extrabold transition-all shadow-xl ${
              selectedFile 
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:translate-y-[-2px]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDraft;