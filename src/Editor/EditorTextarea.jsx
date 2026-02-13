import React from "react";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 
import AiChat from "../components/AiChat";

const EditorTextarea = ({ manualText, setManualText, showChat, quillRef }) => {

  const modules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
      [{ 'size': [] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
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

      {/* ✅ FINAL UPDATED CSS FOR PROFESSIONAL PAGES */}
      <style>{`
        .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #ffffff; /* Poora background white rakha hai */
        }

        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #e5e7eb !important;
          background: #ffffff;
          z-index: 10;
        }

        /* 📄 PAGES CONTAINER */
        .ql-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          align-items: center; /* Page ko center me alignment dega */
          border: none !important;
          background-color: #ffffff; 
        }

        /* 🔥 THE A4 PAPER LOOK & PAGE NUMBERING */
        .ql-editor {
          counter-reset: page; /* Initialize page counter */
          background-color: white !important;
          width: 210mm;           /* A4 Standard Width */
          min-height: 297mm;      /* A4 Standard Height */
          padding: 25mm !important; /* Advocate Standard 1-inch margins */
          margin-top: 20px;
          margin-bottom: 50px;
          border: 1px solid #f3f4f6; /* Subtle page boundary */
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); /* Soft shadow for paper effect */
          
          /* Text Styling */
          font-size: 1.125rem;
          line-height: 1.8;
          font-family: ui-sans-serif, system-ui, sans-serif;
          white-space: pre-wrap !important;
          color: #1a1a1a;
          position: relative;
        }

        /* 🔢 AUTOMATIC PAGE NUMBERING AT BOTTOM */
        .ql-editor::after {
          display: block;
          content: "Page " counter(page);
          counter-increment: page;
          position: absolute;
          bottom: 10mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          color: #9ca3af;
        }

        /* Placeholder positioning fix */
        .ql-editor.ql-blank::before {
          left: 25mm;
          top: 25mm;
          color: #9ca3af;
          font-style: italic;
        }

        /* Table/Code Block Styling */
        .ql-editor pre.ql-syntax {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 1rem;
          font-family: 'Courier New', monospace;
        }

        /* Responsive: Adjust for smaller screens */
        @media (max-width: 210mm) {
          .ql-editor {
            width: 95%;
            padding: 1.5rem !important;
            margin: 10px auto;
          }
        }

        /* 🖨️ PRINT OPTIMIZATION */
        @media print {
          .ql-toolbar, .ql-statusbar { display: none !important; }
          .quill, .ql-container { background: none !important; overflow: visible !important; }
          .ql-editor {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20mm !important; 
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EditorTextarea;