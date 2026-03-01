import React, { useState, useEffect, useRef } from "react";

const AIDrafting = ({ onBack, setManualText, setIsAIGenerating }) => {
  const [step, setStep] = useState(1); // 1: Selection, 2: Fact Form, 3: Editor View
  const [caseFacts, setCaseFacts] = useState("");
  const [language, setLanguage] = useState("English");
  const [rawDraft, setRawDraft] = useState(""); // Stores the draft from AI
  const [liveDraft, setLiveDraft] = useState(""); // Stores the draft with variables filled
  const [selectedFile, setSelectedFile] = useState(null);

  // --- 1. REF FOR FILE UPLOAD ---
  const fileInputRef = useRef(null); // Triggers the hidden file input

  // --- 2. VARIABLE STATE (For Left Sidebar) ---
  const [variables, setVariables] = useState({
    "{name_of_applicant}": "",
    "{father_name_of_applicant}": "",
    "{age_of_applicant}": "",
    "{address_of_applicant}": "",
    "{police_station_name}": "",
    "{bail_application_number}": "",
    "{year}": new Date().getFullYear().toString(),
  });

  // --- 3. LIVE SYNC LOGIC ---
  useEffect(() => {
    let updated = rawDraft;
    Object.keys(variables).forEach((key) => {
      const value = variables[key] || `_____${key.replace(/[{}]/g, "").replace(/_/g, " ")}_____`;
      updated = updated.split(key).join(value);
    });
    setLiveDraft(updated);
  }, [rawDraft, variables]);

  // --- 4. FILE UPLOAD HANDLER ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("File uploaded:", file.name);
      setStep(2); // Move to Fact Form to describe what to do with the file
    }
  };

  // --- 5. API CALL TO GENERATE DRAFT ---
// AIDrafting.jsx के अंदर handleGenerateDraft फ़ंक्शन को अपडेट करें
const handleGenerateDraft = async () => {
  // 1. वैलिडेशन: चेक करें कि यूज़र ने तथ्य लिखे हैं या नहीं
  if (!caseFacts.trim()) return alert("Please enter case facts or details about your draft.");

  // 2. लोडर चालू करें: यह 'setIsAIGenerating is not a function' एरर को भी हैंडल करेगा
  if (typeof setIsAIGenerating === 'function') {
    setIsAIGenerating(true); 
  }
  
  try {
    // 3. FormData तैयार करें: इसमें टेक्स्ट और PDF दोनों फाइलें जाएंगी
    const formData = new FormData();
    formData.append("facts", caseFacts);
    formData.append("language", language);
    formData.append("documentType", "Bail Application"); // आप इसे डायनामिक भी बना सकते हैं
    
    if (selectedFile) {
      formData.append("referenceFile", selectedFile); // यह 'SCAN AMAR.PDF' को भेजेगा
    }

    // 4. बैकएंड API को कॉल करें
    // 'http://localhost:5000' को अपने असली बैकएंड URL से बदलें (यदि अलग है)
    const response = await fetch("http://localhost:5000/api/generate-legal-draft", {
      method: "POST",
      body: formData, // FormData का उपयोग करें ताकि PDF सर्वर पर जा सके
    });

    const data = await response.json();

    if (data.success) {
      // 5. AI से मिले असली ड्राफ्ट को 'rawDraft' स्टेट में सेव करें
      setRawDraft(data.draft); 
      
      // 6. ड्राफ्ट लोड होने के बाद 'Editor View' (Step 3) पर जाएँ
      setStep(3); 
    } else {
      alert("AI was unable to generate a draft: " + data.error);
    }

  } catch (error) {
    console.error("Connection Error:", error);
    alert("Backend Server not responding. Make sure your server.js is running.");
  } finally {
    // 7. लोडर बंद करें
    if (typeof setIsAIGenerating === 'function') {
      setIsAIGenerating(false);
    }
  }
};

  const handleVariableChange = (key, value) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  // --- STEP 1: INITIAL SELECTION MODAL ---
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-3xl w-full mx-4 relative transform transition-all animate-scale-up">
          <button onClick={onBack} className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 text-2xl">✕</button>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">Start drafting by</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* OPTION A: UPLOAD (Now Triggering Hidden Input) */}
            <div 
              onClick={() => fileInputRef.current.click()} 
              className="group border-2 border-dashed border-indigo-100 p-8 rounded-[32px] hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:scale-110 transition-all">📤</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Uploading reference documents</h3>
              <p className="text-sm text-gray-400">Upload existing documents to use as reference.</p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
              />
            </div>

            {/* OPTION B: TYPING */}
            <div 
              onClick={() => setStep(2)} 
              className="group border-2 border-dashed border-blue-100 p-8 rounded-[32px] hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto group-hover:scale-110 transition-all">✍️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Typing facts of the matter</h3>
              <p className="text-sm text-gray-400">Start fresh by providing the facts and details of your case.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 2: CASE FACTS FORM ---
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-2xl w-full mx-4 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 text-xl">✎</div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Tell us more about your draft</h2>
          </div>
          
          {selectedFile && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase">📎 Reference: {selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-xs text-red-500 font-bold underline">Remove</button>
            </div>
          )}

          <textarea 
            className="w-full h-48 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-all text-gray-700 resize-none"
            placeholder="e.g. Draft a Bail Application based on the uploaded High Court order..."
            value={caseFacts}
            onChange={(e) => setCaseFacts(e.target.value)}
          />
          
          <div className="mt-6">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Draft in</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
              <option>English</option><option>Hindi</option><option>Marathi</option>
            </select>
          </div>
          
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep(1)} className="text-gray-500 font-bold">Cancel</button>
            <button 
              onClick={handleGenerateDraft}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 3: 3-COLUMN EDITOR VIEW ---
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm">
        <button onClick={() => setStep(2)} className="text-gray-500 hover:text-indigo-600 font-bold text-sm flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
           Back to Facts
        </button>
        <button 
           onClick={() => {
             setManualText(liveDraft); // Export to main TNT Editor
             onBack(); 
           }}
           className="bg-indigo-600 text-white px-6 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          Export to TNT Editor
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Live Variables */}
        <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Variable Fields</h3>
          <div className="space-y-5">
            {Object.keys(variables).map((key) => (
              <div key={key}>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                  {key.replace(/[{}]/g, "").replace(/_/g, " ")}
                </label>
                <input 
                  type="text" 
                  value={variables[key]}
                  onChange={(e) => handleVariableChange(key, e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Center: A4 Document Preview */}
      {/* Center Column: Document Canvas */}
<div className="flex-1 p-8 overflow-y-auto flex justify-center bg-slate-100/50 scroll-smooth">
  <div className="w-full max-w-[850px] bg-white shadow-2xl p-16 min-h-[1100px] border border-gray-200 rounded-sm transform origin-top">
    {/* अगर ड्राफ्ट खाली है तो लोडिंग मैसेज दिखाएँ */}
    {!liveDraft ? (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 italic">
        <p className="animate-pulse">AI is generating your professional draft...</p>
      </div>
    ) : (
      <pre className="whitespace-pre-wrap font-serif text-[15px] leading-[1.8] text-gray-800 text-justify animate-fade-in">
        {liveDraft}
      </pre>
    )}
    
    <div className="mt-12 text-center text-[10px] text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-8">
      Document Authenticated by NextGen AI Suite
    </div>
  </div>
</div>
        {/* Right: AI Tools (Matching Video) */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)]">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">AI Legal Intelligence</h3>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 transition-all cursor-pointer group">
              <h4 className="font-bold text-emerald-800 text-sm mb-1 flex items-center gap-2">⚖️ Landmark Judgments</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-600">Landmark SC cases fetched based on Section 439 and the facts in your PDF.</p>
            </div>
            <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer group">
              <h4 className="font-bold text-indigo-800 text-sm mb-1 flex items-center gap-2">🛡️ Winning Arguments</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed group-hover:text-gray-600">Specific arguments extracted from the reference file to support your petition.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDrafting;