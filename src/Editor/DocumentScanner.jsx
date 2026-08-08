import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ PDF worker setup (mandatory for react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

const DocumentScanner = ({ file, onClose, onInsertText }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // PDF load success → total pages set
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // User selection → insert into editor
  const handleInsertSelection = () => {
    const selectedText = window.getSelection().toString();
    if (selectedText.trim().length > 0) {
      onInsertText(selectedText);
    } else {
      alert("⚠️ Please highlight some text first!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white p-4 rounded-lg shadow-xl w-3/4 max-w-4xl h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">📄 Document Scanner</h2>
          <div className="flex gap-3">
            <button
              onClick={handleInsertSelection}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              ➕ Insert Selected Text
            </button>
            <button
              onClick={onClose}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 border rounded flex justify-center">
          {file && file.type === "application/pdf" ? (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              className="border shadow-sm"
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}   // ✅ Invisible selectable text layer
                renderAnnotationLayer={false}
                width={800}
              />
            </Document>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>⚠️ Please upload a PDF file. Image OCR support will be added separately.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {numPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <p>Page {pageNumber} of {numPages}</p>
            <button
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentScanner;
