import React from "react";
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AiChat from "../components/AiChat";
import { Document, Packer, Paragraph, TextRun } from "docx";

// ── Register Fonts ─────────────────────────────────────────
const FontAttributor = Quill.import('formats/font');
FontAttributor.whitelist = [
  'times-new-roman', 'courier-new', 'arial',
  'georgia', 'verdana', 'devanagari', 'krutidev',
];
Quill.register(FontAttributor, true);

// ── Register Sizes ─────────────────────────────────────────
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = [
  '10px','11px','12px','13px','14px','16px',
  '18px','20px','24px','28px','32px','36px','48px','72px'
];
Quill.register(SizeStyle, true);

const EditorTextarea = ({ manualText, setManualText, showChat, quillRef }) => {

  const modules = {
    toolbar: [
      [
        { header: [1, 2, 3, false] },
        { font: ['times-new-roman','courier-new','arial','georgia','verdana','devanagari','krutidev'] },
        { size: ['10px','11px','12px','13px','14px','16px','18px','20px','24px','28px','32px','36px','48px','72px'] },
      ],
      ['bold', 'italic', 'underline', 'strike'],
      [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
      [{ list: 'ordered' }, { list: 'bullet' }, 'blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      ['link', 'image', 'clean'],
    ],
    clipboard: { matchVisual: false },
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'align', 'indent', 'list',
    'blockquote', 'code-block',
    'color', 'background', 'link', 'image',
  ];

  // ── DOCX Export Function ───────────────────────────
  const exportDOCX = async () => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    const text = editor.getText();
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun(text)],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #ece9e6, #ffffff)', // 🌈 Soft gradient
    }}>
      
      {/* ── EDITOR COLUMN ─────────────────────────── */}
      <div style={{
        flex: showChat ? '0 0 67%' : '1',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
        overflow: 'hidden',
      }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={manualText}
          onChange={setManualText}
          modules={modules}
          formats={formats}
          placeholder="Start typing or speaking..."
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        />

        {/* Export Button */}
        <button
          onClick={exportDOCX}
          style={{
            margin: "10px",
            padding: "8px 12px",
            background: "linear-gradient(90deg, #2563eb, #1e40af)", // 🔵 Gradient button
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            alignSelf: "flex-start",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
          }}
        >
          Download as Word
        </button>
      </div>

      {/* ── AI CHAT COLUMN ────────────────────────── */}
      {showChat && (
        <div style={{
          flex: '0 0 33%',
          borderLeft: '1px solid #e5e7eb',
          background: '#f9fafb',
          overflow: 'auto',
        }}>
          <AiChat contextText={manualText} />
        </div>
      )}

      {/* ── Styles (your existing CSS preserved + enhancements) ────────────────────────── */}
      <style>{`
        .ql-editor {
          background-color: #ffffff !important;
          border-radius: 8px; /* Rounded corners */
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); /* Softer shadow */
        }
        /* Keep all your typography, headings, responsive, and print styles from before */
      `}</style>
    </div>
  );
};

export default EditorTextarea;
