import React from "react";
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import AiChat from "../components/AiChat";

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
  'align', 'indent', 'list',              // ✅ 'list' alone covers both bullet and ordered
  'blockquote', 'code-block',
  'color', 'background', 'link', 'image',
];
  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      background: '#d0d0d0',
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;700&display=swap');

        /* ════════════════════════════════════════════
           TOOLBAR
           ════════════════════════════════════════════ */
        .ql-toolbar.ql-snow {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #d1d5db !important;
          background: #f5f5f5 !important;
          padding: 5px 8px !important;
          flex-shrink: 0 !important;
          position: sticky;
          top: 0;
          z-index: 20;
          flex-wrap: wrap !important;
        }

        /* ── Font picker labels ──────────────────── */
        .ql-font .ql-picker-label::before,
        .ql-font .ql-picker-item::before                                    { content: 'Default'; }
        .ql-font .ql-picker-label[data-value="times-new-roman"]::before,
        .ql-font .ql-picker-item[data-value="times-new-roman"]::before      { content: 'Times New Roman'; font-family: 'Times New Roman', serif; }
        .ql-font .ql-picker-label[data-value="courier-new"]::before,
        .ql-font .ql-picker-item[data-value="courier-new"]::before          { content: 'Courier New'; font-family: 'Courier New', monospace; }
        .ql-font .ql-picker-label[data-value="arial"]::before,
        .ql-font .ql-picker-item[data-value="arial"]::before                { content: 'Arial'; font-family: Arial, sans-serif; }
        .ql-font .ql-picker-label[data-value="georgia"]::before,
        .ql-font .ql-picker-item[data-value="georgia"]::before              { content: 'Georgia'; font-family: Georgia, serif; }
        .ql-font .ql-picker-label[data-value="verdana"]::before,
        .ql-font .ql-picker-item[data-value="verdana"]::before              { content: 'Verdana'; font-family: Verdana, sans-serif; }
        .ql-font .ql-picker-label[data-value="devanagari"]::before,
        .ql-font .ql-picker-item[data-value="devanagari"]::before           { content: 'देवनागरी'; font-family: 'Noto Serif Devanagari', serif; }
        .ql-font .ql-picker-label[data-value="krutidev"]::before,
        .ql-font .ql-picker-item[data-value="krutidev"]::before             { content: 'Kruti Dev'; }

        /* ── Size picker labels ──────────────────── */
        .ql-size .ql-picker-label::before,
        .ql-size .ql-picker-item::before                                    { content: '16px'; }
        .ql-size .ql-picker-label[data-value="10px"]::before,
        .ql-size .ql-picker-item[data-value="10px"]::before                 { content: '10px'; }
        .ql-size .ql-picker-label[data-value="11px"]::before,
        .ql-size .ql-picker-item[data-value="11px"]::before                 { content: '11px'; }
        .ql-size .ql-picker-label[data-value="12px"]::before,
        .ql-size .ql-picker-item[data-value="12px"]::before                 { content: '12px'; }
        .ql-size .ql-picker-label[data-value="13px"]::before,
        .ql-size .ql-picker-item[data-value="13px"]::before                 { content: '13px'; }
        .ql-size .ql-picker-label[data-value="14px"]::before,
        .ql-size .ql-picker-item[data-value="14px"]::before                 { content: '14px'; }
        .ql-size .ql-picker-label[data-value="16px"]::before,
        .ql-size .ql-picker-item[data-value="16px"]::before                 { content: '16px'; }
        .ql-size .ql-picker-label[data-value="18px"]::before,
        .ql-size .ql-picker-item[data-value="18px"]::before                 { content: '18px'; }
        .ql-size .ql-picker-label[data-value="20px"]::before,
        .ql-size .ql-picker-item[data-value="20px"]::before                 { content: '20px'; }
        .ql-size .ql-picker-label[data-value="24px"]::before,
        .ql-size .ql-picker-item[data-value="24px"]::before                 { content: '24px'; }
        .ql-size .ql-picker-label[data-value="28px"]::before,
        .ql-size .ql-picker-item[data-value="28px"]::before                 { content: '28px'; }
        .ql-size .ql-picker-label[data-value="32px"]::before,
        .ql-size .ql-picker-item[data-value="32px"]::before                 { content: '32px'; }
        .ql-size .ql-picker-label[data-value="36px"]::before,
        .ql-size .ql-picker-item[data-value="36px"]::before                 { content: '36px'; }
        .ql-size .ql-picker-label[data-value="48px"]::before,
        .ql-size .ql-picker-item[data-value="48px"]::before                 { content: '48px'; }
        .ql-size .ql-picker-label[data-value="72px"]::before,
        .ql-size .ql-picker-item[data-value="72px"]::before                 { content: '72px'; }

        /* ════════════════════════════════════════════
           FONT CLASSES applied to editor content
           ════════════════════════════════════════════ */
        .ql-font-times-new-roman { font-family: 'Times New Roman', Times, serif !important; }
        .ql-font-courier-new     { font-family: 'Courier New', Courier, monospace !important; }
        .ql-font-arial           { font-family: Arial, Helvetica, sans-serif !important; }
        .ql-font-georgia         { font-family: Georgia, serif !important; }
        .ql-font-verdana         { font-family: Verdana, Geneva, sans-serif !important; }
        .ql-font-devanagari      { font-family: 'Noto Serif Devanagari', serif !important; }
        .ql-font-krutidev        { font-family: 'Kruti Dev 010', 'Krutidev010', serif !important; }

        /* ════════════════════════════════════════════
           SCROLL AREA — grey background, centers page
           ════════════════════════════════════════════ */
        .ql-container.ql-snow {
          border: none !important;

          /* 
            KEY FIX: Do NOT use flex here.
            overflow-y:auto + text-align:center 
            lets the white page grow naturally 
            as content increases.
          */
          background-color: #d0d0d0 !important;
          flex: 1 !important;
          overflow-y: auto !important;
          overflow-x: auto !important;
          padding: 30px 20px 60px !important;
          box-sizing: border-box;

          /* Center the page horizontally */
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }

        /* ════════════════════════════════════════════
           THE WHITE A4 PAGE
           ════════════════════════════════════════════ */
        .ql-editor {
          /* A4 width fixed, height grows with content */
          width: 210mm !important;
          min-height: 297mm !important;   /* at least one full page */
          height: auto !important;        /* GROW as content increases */

          padding: 25.4mm !important;
          margin: 0 0 40px 0 !important;

          /* White paper */
          background-color: #ffffff !important;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.12),
            0 4px 20px rgba(0,0,0,0.10);

          /* Typography — Word defaults */
          font-family: 'Times New Roman', Times, serif !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          color: #000000;

          /* ⚠️ MUST be normal — pre-wrap breaks Word copy-paste */
          white-space: normal !important;
          word-break: break-word;
          overflow-wrap: break-word;

          /* Let height grow — never clip content */
          overflow: visible !important;
          box-sizing: border-box;
          flex-shrink: 0;
          align-self: center;
        }

        /* ════════════════════════════════════════════
           PARAGRAPH + HEADING STYLES
           ════════════════════════════════════════════ */
        .ql-editor p {
          margin: 0 0 8px 0 !important;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
          line-height: 1.6;
        }
        .ql-editor h1 {
          font-size: 18px !important;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 16px 0 10px;
        }
        .ql-editor h2 {
          font-size: 15px !important;
          font-weight: bold;
          text-decoration: underline;
          margin: 14px 0 8px;
        }
        .ql-editor h3 {
          font-size: 13px !important;
          font-weight: bold;
          text-transform: uppercase;
          margin: 10px 0 4px;
        }
        .ql-editor ol,
        .ql-editor ul  { padding-left: 24px; margin: 4px 0; }
        .ql-editor li  { margin: 2px 0; word-break: break-word; line-height: 1.6; }
        .ql-editor blockquote {
          border-left: 3px solid #888;
          padding: 6px 0 6px 16px;
          margin: 10px 0;
          color: #222;
          font-style: italic;
        }
        .ql-editor pre.ql-syntax {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          white-space: pre-wrap;
          word-break: break-all;
          border-radius: 4px;
        }

        /* Placeholder */
        .ql-editor.ql-blank::before {
          left: 25.4mm !important;
          top: 25.4mm !important;
          right: 25.4mm !important;
          color: #aaa;
          font-style: italic;
          font-family: 'Times New Roman', Times, serif;
          font-size: 16px;
        }

        /* ════════════════════════════════════════════
           RESPONSIVE
           ════════════════════════════════════════════ */
        @media (max-width: 800px) {
          .ql-editor {
            width: 95vw !important;
            min-height: auto !important;
            padding: 15mm !important;
          }
        }

        /* ════════════════════════════════════════════
           PRINT
           ════════════════════════════════════════════ */
        @media print {
          .ql-toolbar { display: none !important; }
          .ql-container {
            background: none !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .ql-editor {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            width: 100% !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default EditorTextarea;
