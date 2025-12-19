import React from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import standard theme styles
import AiChat from "../components/AiChat";

const EditorTextarea = ({ manualText, setManualText, showChat }) => {
  
  // Custom Toolbar configuration to match your screenshots
  const modules = {
    toolbar: [
      [{ 'font': [] }, { 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],        
      [{ 'color': [] }, { 'background': [] }],          
      [{ 'script': 'sub'}, { 'script': 'super' }],      
      [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }, { 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']                                         
    ],
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-white">
      {/* RICH TEXT EDITOR SECTION */}
      <div className={`flex flex-col flex-1 min-w-0 ${showChat ? "w-2/3" : "w-full"}`}>
        <ReactQuill 
          theme="snow"
          value={manualText}
          onChange={setManualText} // ReactQuill returns HTML string
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

      {/* CUSTOM CSS to fix layout and remove sliding under buttons */}
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
          font-size: 1.125rem; /* Matches your text-lg class */
          border: none !important;
        }
        .ql-editor {
          min-height: 100%;
          padding: 2rem; /* Matches your p-8 class */
        }
        /* Ensures the editor doesn't hide behind status bar */
        .ql-editor.ql-blank::before {
          left: 2rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default EditorTextarea;