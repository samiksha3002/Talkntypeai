import React, { useRef } from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 
import AiChat from "../components/AiChat";

const EditorTextarea = ({ manualText, setManualText, showChat }) => {
  const quillRef = useRef(null);

  const modules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'], // 'code-block' button is key for Tables
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }], 
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],          
      ['link', 'image'],
      ['clean']                                     
    ],
    clipboard: {
      matchVisual: false,
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* RICH TEXT EDITOR SECTION */}
      <div className={`flex flex-col flex-1 min-w-0 ${showChat ? "w-2/3" : "w-full"}`}>
        <ReactQuill 
          ref={quillRef}
          theme="snow"
          value={manualText}
          onChange={setManualText} 
          modules={modules}
          placeholder="Start typing or speaking..."
          className="h-full flex flex-col"
        />
      </div>

      {/* AI CHAT SECTION */}
      {showChat && (
        <div className="w-1/3 border-l bg-gray-50">
          <AiChat contextText={manualText} />
        </div>
      )}

      {/* ✅ CUSTOM CSS (Updated for Normal Font + Gaps) */}
      <style>{`
        .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #f9fafb;
        }
        .ql-container {
          flex: 1;
          overflow-y: auto;
          font-size: 1.125rem; 
          border: none !important;
        }
        
        /* 🔥 EDITOR STYLING */
        .ql-editor {
          min-height: 100%;
          padding: 2rem;
          
          /* 1. GAP FIX: यह जरुरी है ताकि OCR के गैप्स न हटें */
          white-space: pre-wrap !important; 

          /* 2. FONT FIX: वापस नॉर्मल (सुंदर) फॉन्ट कर दिया है */
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          
          line-height: 1.6;
        }

        /* 3. BOX FIX: जब आप '<>' (Code Block) बटन दबाएंगे, तब यह स्टाइल लगेगा */
        .ql-editor pre.ql-syntax {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: 'Courier New', monospace; /* सिर्फ बॉक्स के लिए टाइपराइटर फॉन्ट */
          white-space: pre;
          overflow-x: auto;
        }

        .ql-editor.ql-blank::before {
          left: 2rem;
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default EditorTextarea;