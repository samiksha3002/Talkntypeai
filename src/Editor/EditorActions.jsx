import React, { useState, useRef, useEffect } from "react";
import AiButton from "./AiButton"; 
import axios from "axios";
import { Save, Printer, Mic, Trash2, FileUp, FileText } from "lucide-react"; 
import { fixGrammar, expandText, uploadOCR, uploadAudio, uploadPDF } from "./editor.api";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

const EditorActions = ({
  manualText,
  setManualText,
  showChat,
  setShowChat,
  setIsTranslating,
  isOCRLoading,
  setIsOCRLoading,
  isAudioLoading,
  setIsAudioLoading,
  setShowDraftPopup,
  isAIGenerating,
  API
}) => {
  const ocrRef = useRef(null);
  const audioRef = useRef(null);
  const pdfRef = useRef(null); 
  const saveMenuRef = useRef(null);

  const [showCommands, setShowCommands] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [isDictLoading, setIsDictLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
        setShowSaveOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePageBreak = () => {
    const range = quillRef.current.getEditor().getSelection();
    if (range) {
      quillRef.current.getEditor().insertEmbed(range.index, 'break', true);
    }
  }; 
// --- 📄 Save as PDF (Final Fix: Clean Text + Auto Wrapping) ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // 1. Remove HTML tags and convert entities like &nbsp; to actual spaces
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = manualText;
    const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    // 2. Set PDF styles
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // 3. Auto-wrap the text based on page width (180mm is standard for A4)
    const splitText = doc.splitTextToSize(cleanText, 180);

    // 4. Add the wrapped text to the document at coordinates x:15, y:20
    doc.text(splitText, 15, 20);

    // 5. Save the file
    doc.save("document.pdf");
    setShowSaveOptions(false);
  };
  // --- 📝 Save as Word ---
  const handleDownloadWord = () => {
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head><body>`;
    const footer = "</body></html>";
    
    const sourceHTML = header + manualText + footer;

    const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
    });

    saveAs(blob, "document.doc");
    setShowSaveOptions(false);
  };

  // --- 🖨️ Handle Print ---
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 40px; 
              line-height: 1.6; 
              font-size: 12pt;
              white-space: pre-wrap; 
            }
          </style>
        </head>
        <body>${manualText}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDictionarySearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsDictLoading(true);
    setDefinition("");
    try {
      const response = await axios.get(`${API}/api/dictionary/define/${searchTerm}`);
      const def = response.data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
      setDefinition(def || "No definition found for this term.");
    } catch (err) {
      setDefinition("Legal term not found or server is offline.");
    } finally {
      setIsDictLoading(false);
    }
  };


const handleFileSelect = async (e, uploadFunction, setLoadingState) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // Hum koi language pass nahi kar rahe, backend handle karega
        await uploadFunction(e, setManualText, setLoadingState, API);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to process file");
      } finally {
        e.target.value = null;
      }
    }
  };


  const COMMANDS = [
    { symbol: ",", en: "comma", hi: "अल्पविराम", mr: "स्वल्पविराम" },
    { symbol: ".", en: "full stop", hi: "पूर्ण विराम", mr: "पूर्णविराम" },
    { symbol: "!", en: "exclamation", hi: "विस्मयादिबोधक", mr: "आश्चर्यवाचक" },
    { symbol: "⇥", en: "new paragraph", hi: "नया पैराग्राफ", mr: "नवीन परिच्छेद" }
  ];

  return (
    <div className="bg-indigo-50 border-b p-2 flex items-center justify-between flex-wrap gap-2 font-sans relative">
      <div className="flex gap-2 flex-wrap">
        <AiButton label="✨ Fix Grammar" color="blue" onClick={() => fixGrammar(manualText, setManualText, setIsTranslating)} />
        <AiButton label={isOCRLoading ? "⏳ Extracting..." : "🖼️ Image → Text"} color="purple" onClick={() => !isOCRLoading && ocrRef.current.click()} />
        <input ref={ocrRef} type="file" accept="image/*" hidden onChange={(e) => handleFileSelect(e, uploadOCR, setIsOCRLoading)} />
        <AiButton label={isAudioLoading ? "⏳ Detecting..." : "🎵 Audio → Text"} color="green" onClick={() => !isAudioLoading && audioRef.current.click()} />
        <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => handleFileSelect(e, uploadAudio, setIsAudioLoading)} />
        <AiButton label={showChat ? "❌ Close Chat" : "📝 AI Chat"} color="blue" onClick={() => setShowChat(!showChat)} />
        <AiButton label={isAIGenerating ? "⏳ Generating..." : "🧠 Draft"} color="purple" disabled={isAIGenerating} onClick={() => !isAIGenerating && setShowDraftPopup(true)} />
        <AiButton label="↔️ Expand" color="green" onClick={() => expandText(manualText, setManualText, setIsTranslating)} />
        <AiButton label="📖 Dictionary" color="purple" onClick={() => setShowDictionary(true)} />
      </div>

      <div className="flex items-center gap-1 ml-auto border-l pl-2 border-indigo-200 relative">
        <div className="relative" ref={saveMenuRef}>
            <button onClick={() => setShowSaveOptions(!showSaveOptions)} className={`p-2 rounded-full transition-all ${showSaveOptions ? "bg-indigo-100 text-indigo-600" : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"}`} title="Save Options">
                <Save size={18} strokeWidth={2} />
            </button>
            {showSaveOptions && (
                <div className="absolute right-0 top-10 bg-white shadow-xl border border-indigo-100 rounded-lg w-40 z-50 overflow-hidden">
                    <button onClick={handleDownloadPDF} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"><FileText size={16} /> Save as PDF</button>
                    <div className="border-t border-gray-100"></div>
                    <button onClick={handleDownloadWord} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"><FileText size={16} /> Save as Word</button>
                </div>
            )}
        </div>

        <button onClick={handlePrint} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-full transition-all" title="Print">
            <Printer size={18} strokeWidth={2} />
        </button>

        <button onClick={() => setShowCommands(true)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="Voice Commands"><Mic size={20} strokeWidth={2.5} /></button>
        <button onClick={() => setManualText("")} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all" title="Clear All"><Trash2 size={18} strokeWidth={2} /></button>
         <button onClick={() => pdfRef.current.click()} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-full transition-all" title="Import PDF"><FileUp size={18} strokeWidth={2} /></button>
        <input ref={pdfRef} type="file" accept="application/pdf" hidden onChange={(e) => handleFileSelect(e, uploadPDF, setIsTranslating)} />
      </div>

      {showDictionary && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white w-[450px] rounded-xl shadow-2xl p-6 border border-indigo-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">📖 Legal Dictionary</h2>
              <button onClick={() => {setShowDictionary(false); setDefinition(""); setSearchTerm("");}} className="text-gray-400 hover:text-red-500 transition-colors text-2xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleDictionarySearch} className="flex gap-2 mb-6">
              <input type="text" placeholder="Search term" className="flex-1 border-2 border-indigo-50 p-2.5 rounded-lg focus:border-indigo-500 outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
              <button type="submit" disabled={isDictLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md disabled:bg-indigo-300">{isDictLoading ? "..." : "Search"}</button>
            </form>
            {definition && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-indigo-50 p-5 rounded-xl border-l-4 border-indigo-600 shadow-inner max-h-[250px] overflow-y-auto">
                  <h4 className="text-indigo-900 font-bold mb-2 uppercase text-xs tracking-wider">Definition:</h4>
                  <p className="text-sm leading-relaxed text-gray-700 italic">"{definition}"</p>
                </div>
                <button className="w-full mt-4 py-2 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-bold hover:bg-indigo-600 hover:text-white transition-all text-sm"
                  onClick={() => {setManualText(prev => prev + `\n\n[Definition: ${searchTerm}] - ${definition}`); setShowDictionary(false); setSearchTerm(""); setDefinition("");}}>
                  ➕ Insert into Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCommands && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
             <div className="bg-white w-[500px] rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-800">🎙️ Voice Commands</h2>
            <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm border border-indigo-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                  <th className="border p-2">Symbol</th>
                  <th className="border p-2">English</th>
                  <th className="border p-2">Hindi</th>
                  <th className="border p-2">Marathi</th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map((cmd, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="border p-2 text-center font-bold text-indigo-600">{cmd.symbol}</td>
                    <td className="border p-2">{cmd.en}</td>
                    <td className="border p-2">{cmd.hi}</td>
                    <td className="border p-2">{cmd.mr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => setShowCommands(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorActions;