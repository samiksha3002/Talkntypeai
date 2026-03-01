import React, { useState } from "react";

const ChatWithPDF = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Trigger AI Analysis for List of Dates or Summary here
    }
  };

  return (
    <div className="flex-1 bg-white h-full flex flex-col overflow-hidden">
      {/* 1. Professional Header */}
      <div className="h-16 border-b border-gray-100 flex items-center px-6 justify-between bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">Chat with PDF</h1>
        </div>
        {file && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            {file.name}
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {!file ? (
          /* --- UPLOAD STATE --- */
          <div className="flex-1 flex flex-col items-center justify-center p-10">
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-dashed border-indigo-200 flex flex-col items-center max-w-xl w-full">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-6">📄</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Legal Document</h2>
              <p className="text-gray-500 text-center mb-8 leading-relaxed">
                Upload your charge sheet, case file, or any legal PDF (up to 250+ pages). AI will prepare a list of dates and answer your questions.
              </p>
              <input type="file" id="pdf-upload" hidden onChange={handleFileUpload} accept=".pdf" />
              <label 
                htmlFor="pdf-upload" 
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                Choose PDF File
              </label>
            </div>
          </div>
        ) : (
          /* --- CHAT INTERFACE --- */
          <div className="flex-1 flex flex-row overflow-hidden">
            {/* Left: PDF Preview / Summary (Placeholder) */}
            <div className="w-1/3 border-r border-gray-200 bg-white p-6 overflow-y-auto">
              <h3 className="font-bold text-gray-800 mb-4">Quick Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase mb-1">List of Dates</h4>
                  <p className="text-sm text-gray-500 italic">AI is extracting timeline...</p>
                </div>
              </div>
            </div>

            {/* Right: AI Chat Interface */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-indigo-50 p-4 rounded-2xl max-w-[80%] self-start border border-indigo-100">
                  <p className="text-indigo-900 text-sm">
                    Hello! I've analyzed your document. You can ask me questions like "Who are the witnesses?" or "Give me a summary of Page 165".
                  </p>
                </div>
                {/* Chat messages would go here */}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-gray-100">
                <div className="flex gap-3 bg-slate-100 p-2 rounded-2xl">
                  <input 
                    type="text" 
                    placeholder="Ask anything about the document..." 
                    className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWithPDF;