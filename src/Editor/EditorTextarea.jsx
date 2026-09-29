import React, { useEffect, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import AiChat from "../components/AiChat";

// ============================================================
// FONT REGISTRATION
// ============================================================

const FontAttributor = Quill.import("formats/font");

FontAttributor.whitelist = [
  "times-new-roman",
  "courier-new",
  "arial",
  "georgia",
  "verdana",
  "devanagari",
  "krutidev",
];

Quill.register(FontAttributor, true);


// ============================================================
// SIZE REGISTRATION
// ============================================================

const SizeStyle = Quill.import("attributors/style/size");

SizeStyle.whitelist = [
  "10px",
  "11px",
  "12px",
  "13px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "48px",
  "72px",
];

Quill.register(SizeStyle, true);


// ============================================================
// EDITOR TEXTAREA
// ============================================================

const EditorTextarea = ({
  manualText,
  setManualText,
  showChat,
  quillRef,
}) => {

  const editorWrapperRef = useRef(null);

  const [pageCount, setPageCount] = useState(1);


  // ==========================================================
  // QUILL MODULES
  // ==========================================================

  const modules = {
    toolbar: [
      [
        { header: [1, 2, 3, false] },

        {
          font: [
            "times-new-roman",
            "courier-new",
            "arial",
            "georgia",
            "verdana",
            "devanagari",
            "krutidev",
          ],
        },

        {
          size: [
            "10px",
            "11px",
            "12px",
            "13px",
            "14px",
            "16px",
            "18px",
            "20px",
            "24px",
            "28px",
            "32px",
            "36px",
            "48px",
            "72px",
          ],
        },
      ],

      ["bold", "italic", "underline", "strike"],

      [
        { align: "" },
        { align: "center" },
        { align: "right" },
        { align: "justify" },
      ],

      [
        { indent: "-1" },
        { indent: "+1" },
      ],

      [
        { list: "ordered" },
        { list: "bullet" },
      ],

      [
        "blockquote",
        "code-block",
      ],

      [
        { color: [] },
        { background: [] },
      ],

      [
        "link",
        "image",
        "clean",
      ],
    ],

    clipboard: {
      matchVisual: false,
    },

    history: {
      delay: 1000,
      maxStack: 200,
      userOnly: true,
    },
  };


  // ==========================================================
  // QUILL FORMATS
  // ==========================================================

  const formats = [
    "header",
    "font",
    "size",

    "bold",
    "italic",
    "underline",
    "strike",

    "align",
    "indent",

    "list",

    "blockquote",
    "code-block",

    "color",
    "background",

    "link",
    "image",
  ];


  // ==========================================================
  // PAGE COUNT
  //
  // This calculates how many A4-height areas the document
  // currently occupies.
  // ==========================================================

  useEffect(() => {

    const calculatePages = () => {

      const quill = quillRef?.current;

      if (!quill) {
        setPageCount(1);
        return;
      }

      const editor = quill.getEditor();

      if (!editor?.root) {
        setPageCount(1);
        return;
      }

      const root = editor.root;

      const pageHeightPx =
        1122.52; // approximately 297mm at 96 DPI

      const contentHeight = Math.max(
        root.scrollHeight,
        root.offsetHeight,
        1
      );

      const pages = Math.max(
        1,
        Math.ceil(contentHeight / pageHeightPx)
      );

      setPageCount(pages);
    };


    const timer = setTimeout(calculatePages, 100);

    const resizeObserver = new ResizeObserver(
      calculatePages
    );

    const editorElement =
      quillRef?.current?.getEditor?.()?.root;

    if (editorElement) {
      resizeObserver.observe(editorElement);
    }


    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };

  }, [
    manualText,
    quillRef,
  ]);


  // ==========================================================
  // COPY TO WORD
  //
  // This is VERY important for TNT.
  //
  // When user copies content from TNT:
  //
  // TNT -> Copy -> Microsoft Word
  //
  // we put BOTH:
  //
  // 1. HTML
  // 2. Plain text
  //
  // onto clipboard.
  //
  // HTML contains inline formatting so Word can preserve:
  //
  // - alignment
  // - font
  // - font size
  // - bold
  // - italic
  // - underline
  // - indentation
  // - lists
  // - paragraph spacing
  // ==========================================================

  useEffect(() => {

    const quillInstance =
      quillRef?.current?.getEditor?.();

    if (!quillInstance) return;

    const editorElement =
      quillInstance.root;

    if (!editorElement) return;


    const copyHandler = (event) => {

      const selection =
        window.getSelection();

      if (!selection || selection.rangeCount === 0) {
        return;
      }


      const range =
        selection.getRangeAt(0);


      if (
        !editorElement.contains(
          range.commonAncestorContainer
        )
      ) {
        return;
      }


      event.preventDefault();


      // --------------------------------------------
      // Clone selected HTML
      // --------------------------------------------

      const container =
        document.createElement("div");

      container.appendChild(
        range.cloneContents()
      );


      // --------------------------------------------
      // Inline important computed styles
      // for Microsoft Word compatibility.
      // --------------------------------------------

      const elements =
        container.querySelectorAll("*");


      elements.forEach((element) => {

        const sourceElement =
          editorElement.querySelector(
            `[data-copy-source="${element.getAttribute(
              "data-copy-source"
            )}"]`
          );


        const computed =
          sourceElement
            ? window.getComputedStyle(sourceElement)
            : null;


        if (!computed) return;


        const existingStyle =
          element.getAttribute("style") || "";


        const importantStyles = [

          `font-family:${computed.fontFamily}`,

          `font-size:${computed.fontSize}`,

          `font-weight:${computed.fontWeight}`,

          `font-style:${computed.fontStyle}`,

          `text-decoration:${computed.textDecoration}`,

          `text-align:${computed.textAlign}`,

          `line-height:${computed.lineHeight}`,

          `color:${computed.color}`,

          `background-color:${computed.backgroundColor}`,

          `margin-top:${computed.marginTop}`,

          `margin-bottom:${computed.marginBottom}`,

          `padding-left:${computed.paddingLeft}`,

        ];


        element.setAttribute(
          "style",
          `${existingStyle};${importantStyles.join(";")}`
        );

      });


      // --------------------------------------------
      // Stronger formatting conversion.
      //
      // Quill uses classes such as:
      //
      // ql-align-center
      // ql-align-right
      // ql-align-justify
      // ql-indent-1
      //
      // Word understands inline styles much better.
      // --------------------------------------------

      container
        .querySelectorAll(
          ".ql-align-center"
        )
        .forEach((el) => {

          el.style.textAlign = "center";

        });


      container
        .querySelectorAll(
          ".ql-align-right"
        )
        .forEach((el) => {

          el.style.textAlign = "right";

        });


      container
        .querySelectorAll(
          ".ql-align-justify"
        )
        .forEach((el) => {

          el.style.textAlign = "justify";

        });


      container
        .querySelectorAll(
          ".ql-align-left"
        )
        .forEach((el) => {

          el.style.textAlign = "left";

        });


      container
        .querySelectorAll(
          '[class*="ql-indent-"]'
        )
        .forEach((el) => {

          const classes =
            Array.from(el.classList);

          const indentClass =
            classes.find((cls) =>
              /^ql-indent-\d+$/.test(cls)
            );


          if (!indentClass) return;


          const level =
            Number(
              indentClass.replace(
                "ql-indent-",
                ""
              )
            );


          el.style.paddingLeft =
            `${level * 36}px`;

        });


      // --------------------------------------------
      // Create Word-friendly HTML
      // --------------------------------------------

      const html =
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>

            body {
              font-family:
                "Times New Roman",
                Times,
                serif;

              font-size: 14pt;

              line-height: 1.5;
            }

            p {
              margin-top: 0;
              margin-bottom: 8pt;
            }

            .ql-align-center {
              text-align: center;
            }

            .ql-align-right {
              text-align: right;
            }

            .ql-align-left {
              text-align: left;
            }

            .ql-align-justify {
              text-align: justify;
            }

          </style>
        </head>

        <body>

          ${container.innerHTML}

        </body>
        </html>
        `;


      // --------------------------------------------
      // Plain text
      // --------------------------------------------

      const plainText =
        container.innerText ||
        selection.toString();


      // --------------------------------------------
      // Put BOTH HTML and plain text on clipboard.
      // Word normally prefers HTML.
      // --------------------------------------------

      event.clipboardData.setData(
        "text/html",
        html
      );

      event.clipboardData.setData(
        "text/plain",
        plainText
      );
    };


    editorElement.addEventListener(
      "copy",
      copyHandler
    );


    return () => {

      editorElement.removeEventListener(
        "copy",
        copyHandler
      );

    };

  }, [quillRef, manualText]);


  // ==========================================================
  // RETURN
  // ==========================================================

  return (

    <div
      ref={editorWrapperRef}
      className="tnt-editor-layout"
    >

      {/* ======================================================
          DOCUMENT EDITOR
      ====================================================== */}

      <div
        className={
          showChat
            ? "tnt-document-column tnt-document-column-chat"
            : "tnt-document-column"
        }
      >

        <ReactQuill

          ref={quillRef}

          theme="snow"

          value={manualText}

          onChange={setManualText}

          modules={modules}

          formats={formats}

          placeholder="Start typing or speaking..."

          className="tnt-quill-editor"

        />


        {/* ====================================================
            PAGE COUNTER
        ==================================================== */}

        <div className="tnt-page-counter">

          Page {pageCount}

          {pageCount > 1
            ? ` of ${pageCount}`
            : ""}

        </div>

      </div>


      {/* ======================================================
          AI CHAT
      ====================================================== */}

      {showChat && (

        <div className="tnt-ai-chat-column">

          <AiChat
            contextText={manualText}
          />

        </div>

      )}


      {/* ======================================================
          STYLES
      ====================================================== */}

      <style>{`

        /* ====================================================
           MAIN EDITOR
        ==================================================== */

        .tnt-editor-layout {

          display: flex;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          background: #e5e5e5;
        }


        /* ====================================================
           DOCUMENT COLUMN
        ==================================================== */

        .tnt-document-column {

          position: relative;

          flex: 1;

          min-width: 0;
          min-height: 0;

          height: 100%;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }


        .tnt-document-column-chat {

          flex: 0 0 67%;
        }


        /* ====================================================
           QUILL ROOT
        ==================================================== */

        .tnt-quill-editor {

          display: flex;

          flex-direction: column;

          width: 100%;
          height: 100%;

          min-height: 0;

          border: none !important;
        }


        /* ====================================================
           TOOLBAR
        ==================================================== */

        .tnt-quill-editor .ql-toolbar {

          flex-shrink: 0;

          background: #ffffff;

          border: none !important;

          border-bottom:
            1px solid #d6d6d6 !important;

          padding: 8px 12px;

          z-index: 20;
        }


        /* ====================================================
           TOOLBAR FONT DROPDOWN LABELS
        ==================================================== */

       /* ====================================================
   FONT DROPDOWN
==================================================== */

/* Default selected font */
.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-label::before {
  content: "Sans Serif";
}

/* Dropdown options */
.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="times-new-roman"]::before {
  content: "Times New Roman";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="courier-new"]::before {
  content: "Courier New";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="arial"]::before {
  content: "Arial";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="georgia"]::before {
  content: "Georgia";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="verdana"]::before {
  content: "Verdana";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="devanagari"]::before {
  content: "Devanagari";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-font
.ql-picker-item[data-value="krutidev"]::before {
  content: "Kruti Dev";
}


/* ====================================================
   SIZE DROPDOWN
==================================================== */

/* Default selected size */
.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-label::before {
  content: "Normal";
}


/* Dropdown options */

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="10px"]::before {
  content: "10px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="11px"]::before {
  content: "11px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="12px"]::before {
  content: "12px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="13px"]::before {
  content: "13px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="14px"]::before {
  content: "14px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="16px"]::before {
  content: "16px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="18px"]::before {
  content: "18px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="20px"]::before {
  content: "20px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="24px"]::before {
  content: "24px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="28px"]::before {
  content: "28px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="32px"]::before {
  content: "32px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="36px"]::before {
  content: "36px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="48px"]::before {
  content: "48px";
}

.tnt-quill-editor
.ql-snow
.ql-picker.ql-size
.ql-picker-item[data-value="72px"]::before {
  content: "72px";
}

        /* ====================================================
           DOCUMENT CONTAINER
        ==================================================== */

        .tnt-quill-editor .ql-container {

          flex: 1;

          min-height: 0;

          border: none !important;

          overflow-y: auto;
          overflow-x: auto;

          background: #e5e5e5;

          font-family:
            "Times New Roman",
            Times,
            serif;
        }


        /* ====================================================
           A4 DOCUMENT
        ==================================================== */

        .tnt-quill-editor .ql-editor {

          width: 210mm;

          min-height: 297mm;

          box-sizing: border-box;

          margin: 24px auto;

          padding:
            25.4mm;

          background: #ffffff;

          border-radius: 0;

          box-shadow:
            0 2px 10px
            rgba(0, 0, 0, 0.12);

          color: #111111;

          font-family:
            "Times New Roman",
            Times,
            serif;

          font-size: 14pt;

          line-height: 1.5;

          text-align: justify;

          overflow-wrap: break-word;

          word-break: normal;

          overflow: visible;

          outline: none;
        }


        /* ====================================================
           PARAGRAPHS
        ==================================================== */

        .tnt-quill-editor
        .ql-editor p {

          margin-top: 0;

          margin-bottom: 8pt;

          line-height: 1.5;

          text-align: justify;
        }


        /* ====================================================
           ALIGNMENT
        ==================================================== */

        .tnt-quill-editor
        .ql-editor
        .ql-align-left {

          text-align: left !important;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-align-center {

          text-align: center !important;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-align-right {

          text-align: right !important;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-align-justify {

          text-align: justify !important;
        }


        /* ====================================================
           INDENTATION
        ==================================================== */

        .tnt-quill-editor
        .ql-editor
        .ql-indent-1 {

          padding-left: 3em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-2 {

          padding-left: 6em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-3 {

          padding-left: 9em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-4 {

          padding-left: 12em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-5 {

          padding-left: 15em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-6 {

          padding-left: 18em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-7 {

          padding-left: 21em;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-indent-8 {

          padding-left: 24em;
        }


        /* ====================================================
           HEADINGS
        ==================================================== */

        .tnt-quill-editor
        .ql-editor h1,
        .tnt-quill-editor
        .ql-editor h2,
        .tnt-quill-editor
        .ql-editor h3 {

          font-family:
            "Times New Roman",
            Times,
            serif;

          line-height: 1.3;

          margin-top: 14pt;

          margin-bottom: 10pt;
        }


        .tnt-quill-editor
        .ql-editor h1 {

          font-size: 18pt;

          text-align: center;
        }


        .tnt-quill-editor
        .ql-editor h2 {

          font-size: 16pt;

          text-align: center;
        }


        .tnt-quill-editor
        .ql-editor h3 {

          font-size: 14pt;

          text-align: center;
        }


        /* ====================================================
           LISTS
        ==================================================== */

        .tnt-quill-editor
        .ql-editor ol,
        .tnt-quill-editor
        .ql-editor ul {

          margin-top: 0;

          margin-bottom: 8pt;

          padding-left: 2.5em;
        }


        .tnt-quill-editor
        .ql-editor li {

          line-height: 1.5;

          margin-bottom: 4pt;
        }


        /* ====================================================
           BLOCKQUOTE
        ==================================================== */

        .tnt-quill-editor
        .ql-editor blockquote {

          margin-top: 8pt;

          margin-bottom: 8pt;

          padding-left: 20px;

          border-left:
            3px solid #999;

          font-style: italic;
        }


        /* ====================================================
           FONT FAMILIES
        ==================================================== */

        .tnt-quill-editor
        .ql-editor
        .ql-font-times-new-roman {

          font-family:
            "Times New Roman",
            Times,
            serif;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-font-courier-new {

          font-family:
            "Courier New",
            Courier,
            monospace;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-font-arial {

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-font-georgia {

          font-family:
            Georgia,
            serif;
        }


        .tnt-quill-editor
        .ql-editor
        .ql-font-verdana {

          font-family:
            Verdana,
            sans-serif;
        }


        /* ====================================================
           FONT SIZES
        ==================================================== */

        .tnt-quill-editor
        .ql-editor
        .ql-size-10px {
          font-size: 10px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-11px {
          font-size: 11px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-12px {
          font-size: 12px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-13px {
          font-size: 13px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-14px {
          font-size: 14px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-16px {
          font-size: 16px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-18px {
          font-size: 18px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-20px {
          font-size: 20px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-24px {
          font-size: 24px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-28px {
          font-size: 28px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-32px {
          font-size: 32px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-36px {
          font-size: 36px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-48px {
          font-size: 48px;
        }

        .tnt-quill-editor
        .ql-editor
        .ql-size-72px {
          font-size: 72px;
        }


        /* ====================================================
           AI CHAT
        ==================================================== */

        .tnt-ai-chat-column {

          flex: 0 0 33%;

          min-width: 0;

          height: 100%;

          border-left:
            1px solid #e5e7eb;

          background: #f9fafb;

          overflow-y: auto;
        }


        /* ====================================================
           PAGE COUNTER
        ==================================================== */

        .tnt-page-counter {

          position: absolute;

          right: 18px;

          bottom: 8px;

          z-index: 50;

          padding:
            4px 10px;

          border-radius: 12px;

          background:
            rgba(255, 255, 255, 0.95);

          border:
            1px solid #d9d9d9;

          color: #555;

          font-size: 12px;

          pointer-events: none;
        }


        /* ====================================================
           SCROLLBAR
        ==================================================== */

        .tnt-quill-editor
        .ql-container::-webkit-scrollbar {

          width: 10px;
        }


        .tnt-quill-editor
        .ql-container::-webkit-scrollbar-thumb {

          background: #bdbdbd;

          border-radius: 5px;
        }


        .tnt-quill-editor
        .ql-container::-webkit-scrollbar-track {

          background: #e5e5e5;
        }


        /* ====================================================
           PRINT
        ==================================================== */

        @media print {

          @page {

            size: A4;

            margin: 0;
          }


          html,
          body {

            margin: 0 !important;

            padding: 0 !important;

            background: #ffffff !important;
          }


          .tnt-editor-layout {

            display: block;

            width: 100%;

            height: auto;

            overflow: visible;

            background: #ffffff !important;
          }


          .tnt-document-column {

            display: block;

            width: 100% !important;

            height: auto !important;

            overflow: visible;
          }


          .tnt-quill-editor {

            display: block;

            width: 100%;

            height: auto !important;
          }


          .tnt-quill-editor .ql-toolbar {

            display: none !important;
          }


          .tnt-quill-editor .ql-container {

            display: block;

            height: auto !important;

            overflow: visible !important;

            background: #ffffff !important;

            border: none !important;
          }


          .tnt-quill-editor .ql-editor {

            width: 210mm;

            min-height: 297mm;

            margin: 0;

            padding: 25.4mm;

            box-sizing: border-box;

            background: #ffffff !important;

            box-shadow: none;

            overflow: visible !important;

            color: #000000;
          }


          .tnt-ai-chat-column {

            display: none !important;
          }


          .tnt-page-counter {

            display: none !important;
          }
        }


        /* ====================================================
           RESPONSIVE
        ==================================================== */

        @media (max-width: 1000px) {

          .tnt-quill-editor
          .ql-editor {

            width:
              calc(100% - 32px);

            margin: 16px;

            padding:
              20mm 15mm;
          }
        }

      `}</style>

    </div>
  );
};


export default EditorTextarea;