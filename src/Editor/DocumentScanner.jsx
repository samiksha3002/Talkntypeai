import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ScanText,
  Copy,
  Plus,
  X,
  Loader2,
  Download,
  FileCheck2,
} from "lucide-react";

// ✅ FIX: the old "?worker" import handed pdf.js a Worker *class*, not a URL —
// GlobalWorkerOptions.workerSrc needs a URL string. Pulling it from a CDN that
// matches whatever pdfjs-dist version react-pdf bundled avoids that mismatch
// and works the same under Vite, CRA, or webpack.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Below this many characters of extracted text, we treat the page as a
// scanned image with no real text layer (rather than a born-digital PDF page).
const MIN_TEXT_CHARS_FOR_SELECTABLE = 15;

// 🟢 FIX: mirrors the same base-URL logic already used in editor.api.js.
// The parent wasn't passing the `API` prop down, so every OCR call was
// hitting "undefined/api/..." → 404. This fallback means DocumentScanner
// keeps working even if that prop gets missed again.
const DEFAULT_API =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://talkntypeai.onrender.com";

/**
 * DocumentScanner
 *
 * Opens a PDF or image in a modal. Supports three separate things now:
 *  1. Selecting real text out of a born-digital PDF page and inserting it.
 *  2. Server-side OCR that returns plain TEXT (existing "Run OCR" flow) —
 *     good when you just want to paste the content into the editor.
 *  3. 🆕 Server-side OCR that returns a brand new, downloadable PDF FILE
 *     with an invisible, searchable/selectable text layer stitched onto
 *     the original scanned page image ("Convert to Searchable PDF") —
 *     same idea as iLovePDF's "OCR PDF" tool: the page looks identical,
 *     but Ctrl+F / text-select now works on it.
 *
 * Props:
 *  - file        : File object (application/pdf or image/*)
 *  - onClose     : () => void
 *  - onInsertText: (text: string) => void
 *  - API         : string — backend base URL (same one EditorActions gets).
 *                  Expected endpoints (adjust to match your backend):
 *                    POST `${API}/api/ocr/image-to-text`            → { success, text }
 *                    POST `${API}/api/upload-pdf`                   → { success, text }
 *                    POST `${API}/api/ocr/image-to-searchable-pdf`  → PDF file (application/pdf)
 *                    POST `${API}/api/ocr/pdf-to-searchable-pdf`    → PDF file (application/pdf)
 */
const DocumentScanner = ({ file, onClose, onInsertText, API }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageHasText, setPageHasText] = useState(null); // null = still checking this page
  const [loadError, setLoadError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  const [liveSelection, setLiveSelection] = useState(""); // 🟢 FIX: holds the last real selection

  // 🆕 Searchable-PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfGenError, setPdfGenError] = useState(null);
  const [searchablePdfUrl, setSearchablePdfUrl] = useState(null);
  const [searchablePdfName, setSearchablePdfName] = useState("");

  const viewerRef = useRef(null);

  const isPdf = file && file.type === "application/pdf";
  const isImage = file && file.type?.startsWith("image/");

  // Reset everything when a new file is opened
  useEffect(() => {
    setNumPages(null);
    setPageNumber(1);
    setPageHasText(null);
    setLoadError(null);
    setOcrText("");
    setOcrError(null);
    setShowOcrPanel(false);
    setLiveSelection("");

    // 🆕 clear any previously generated searchable PDF + free its blob URL
    setPdfGenError(null);
    setSearchablePdfUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });
    setSearchablePdfName("");

    if (isImage) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // 🆕 Make sure the generated-PDF blob URL is always released, even if the
  // modal is closed (unmounted) without opening a new file first.
  useEffect(() => {
    return () => {
      if (searchablePdfUrl) URL.revokeObjectURL(searchablePdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🟢 FIX: clicking the "Insert Selected Text" button itself collapses the
  // browser's live selection (happens on mousedown, before onClick even runs) —
  // so by the time handleInsertSelection read window.getSelection(), it was
  // already empty. We capture it ahead of time instead.
  //
  // 🔴 REGRESSION FIX: this used to listen on "selectionchange", but that event
  // fires continuously while dragging (many times per second, on every small
  // mouse movement). Each firing called setLiveSelection → a re-render →
  // which was disturbing react-pdf's text-layer DOM enough to collapse the
  // browser's own in-progress selection, so the blue highlight never had a
  // chance to appear. "mouseup" fires exactly once, right when the user
  // finishes dragging — well before they later click Insert — so we get the
  // same protection with zero interference while selecting.
  useEffect(() => {
    const captureSelectionOnRelease = () => {
      const text = window.getSelection()?.toString() || "";
      if (text.trim()) setLiveSelection(text);
    };
    document.addEventListener("mouseup", captureSelectionOnRelease);
    return () => document.removeEventListener("mouseup", captureSelectionOnRelease);
  }, []);

  // Re-check text-layer status for the newly shown page. Note: ocrText is
  // NOT cleared here — the backend OCRs the whole document in one go (see
  // runOCR), so the result stays valid while flipping between pages.
  useEffect(() => {
    setPageHasText(null);
    setLiveSelection("");
  }, [pageNumber]);

  // Safety net: if onGetTextSuccess never fires (older react-pdf versions),
  // don't leave the OCR option permanently hidden — assume "no text" after a beat.
  useEffect(() => {
    if (!isPdf || pageHasText !== null) return;
    const t = setTimeout(() => setPageHasText((prev) => (prev === null ? false : prev)), 2500);
    return () => clearTimeout(t);
  }, [isPdf, pageNumber, pageHasText]);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const onDocumentLoadError = (err) => setLoadError(err?.message || "PDF load nahi ho payi.");

  // react-pdf hands us every text item pdf.js found on the rendered page.
  // Almost nothing there ⇒ this page is a scanned image with no text layer.
  const onPageTextSuccess = useCallback((textContent) => {
    const joined = (textContent?.items || []).map((it) => it.str).join("").trim();
    setPageHasText(joined.length >= MIN_TEXT_CHARS_FOR_SELECTABLE);
  }, []);

  const handleInsertSelection = () => {
    const text = liveSelection || window.getSelection()?.toString() || "";
    if (!text.trim()) {
      alert("⚠️ Pehle document mein se kuch text highlight/select karein.");
      return;
    }
    onInsertText(text);
    setLiveSelection("");
  };

  // Server-side OCR fallback — used for scanned PDF pages and for images.
  // Returns plain TEXT (for pasting into the editor). For a downloadable
  // searchable PDF file, see generateSearchablePdf() below.
  const runOCR = async () => {
    setIsOcrLoading(true);
    setOcrError(null);
    setShowOcrPanel(true);
    const baseUrl = API || DEFAULT_API;

    try {
      const formData = new FormData();
      let endpoint;

      if (isImage) {
        formData.append("image", file); // field name must be "image" — matches uploadOCR in editor.api.js
        endpoint = `${baseUrl}/api/ocr/image-to-text`;
      } else {
        formData.append("file", file); // field name must be "file" — matches uploadPDF in editor.api.js
        endpoint = `${baseUrl}/api/upload-pdf`;
        // ⚠️ This route currently OCRs the WHOLE pdf, not a single page — there's
        // no per-page OCR endpoint on the backend yet. If one gets added later,
        // send `pageNumber` here too and this becomes page-scoped extraction.
      }

      const res = await fetch(endpoint, { method: "POST", body: formData });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.text) {
        setOcrText(data.text.trim());
      } else {
        throw new Error(data.error || "Is file mein koi text nahi mila.");
      }
    } catch (err) {
      console.error("OCR failed:", err);
      setOcrError(`OCR extract nahi ho paya: ${err.message}`);
    } finally {
      setIsOcrLoading(false);
    }
  };

  // 🆕 Server-side OCR that returns an actual, downloadable PDF FILE — the
  // scanned page(s) rendered exactly as before, with an invisible text layer
  // laid on top so the PDF becomes selectable + searchable (Ctrl+F works).
  // This is the "OCR PDF" feature — same concept as iLovePDF's tool.
  const generateSearchablePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfGenError(null);
    const baseUrl = API || DEFAULT_API;

    // Free any previous result before making a new one
    setSearchablePdfUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });

    try {
      const formData = new FormData();
      let endpoint;

      if (isImage) {
        formData.append("image", file); // same field-naming convention as runOCR()
        endpoint = `${baseUrl}/api/ocr/image-to-searchable-pdf`;
      } else {
        formData.append("file", file);
        endpoint = `${baseUrl}/api/ocr/pdf-to-searchable-pdf`;
        // Whole-document, same scope as "Run OCR on Full PDF" above.
      }

      const res = await fetch(endpoint, { method: "POST", body: formData });

      if (!res.ok) {
        // Backend sends JSON on failure ({ error: "..." })
        let message = `Server error ${res.status}`;
        try {
          const errBody = await res.json();
          message = errBody.error || message;
        } catch {
          // response wasn't JSON — keep the generic message
        }
        throw new Error(message);
      }

      const blob = await res.blob();

      // Guard: if the backend accidentally sent a 200 with a JSON error body
      // instead of a real PDF, don't hand the user a broken "PDF".
      if (blob.type && !blob.type.includes("pdf")) {
        const text = await blob.text();
        let message = "Searchable PDF ban nahi paayi.";
        try {
          message = JSON.parse(text).error || message;
        } catch {
          // not JSON either — keep the generic message
        }
        throw new Error(message);
      }

      const url = URL.createObjectURL(blob);
      const baseName = (file.name || "document").replace(/\.[^/.]+$/, "");
      setSearchablePdfUrl(url);
      setSearchablePdfName(`${baseName}-searchable.pdf`);
    } catch (err) {
      console.error("Searchable PDF generation failed:", err);
      setPdfGenError(`Searchable PDF nahi ban payi: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyOcr = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
  };

  const handleInsertOcr = () => {
    if (!ocrText) return;
    onInsertText(ocrText);
  };

  if (!file) return null;

  const showOcrButton = isImage || (isPdf && pageHasText !== null);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-indigo-100 bg-indigo-50">
          <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2 truncate">
            📄 Document Scanner
            {file?.name && <span className="text-xs font-normal text-indigo-400 truncate">— {file.name}</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white shrink-0"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body: viewer + OCR side panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={viewerRef} className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
              {isPdf && !loadError && (
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={<p className="text-gray-500 pt-10 text-sm">PDF load ho raha hai...</p>}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={680}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                    onGetTextSuccess={onPageTextSuccess}
                    loading={<p className="text-gray-500 pt-10 text-sm">Page render ho raha hai...</p>}
                  />
                </Document>
              )}

              {isImage && imageUrl && (
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain rounded-lg shadow"
                />
              )}

              {!isPdf && !isImage && (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center px-6">
                  ⚠️ Sirf PDF ya image files supported hain.
                </div>
              )}

              {loadError && (
                <div className="flex items-center justify-center h-full text-red-500 text-sm text-center px-6">
                  ⚠️ {loadError}
                </div>
              )}
            </div>

            {/* Page navigation (PDF only) */}
            {isPdf && numPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-2.5 border-t border-gray-100 bg-white">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                  className="p-2 bg-gray-100 rounded-full disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm text-gray-600">
                  Page {pageNumber} of {numPages}
                </p>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="p-2 bg-gray-100 rounded-full disabled:opacity-40 hover:bg-gray-200 transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Action row */}
            <div className="flex flex-wrap gap-2 justify-center items-center py-3 border-t border-gray-100 bg-white">
              {isPdf && pageHasText && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleInsertSelection}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                  <Plus size={16} /> Insert Selected Text
                </button>
              )}

              {isPdf && pageHasText === false && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  Ye page scanned lagta hai — koi selectable text nahi mila.
                </span>
              )}

              {showOcrButton && (
                <button
                  onClick={runOCR}
                  disabled={isOcrLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                >
                  {isOcrLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Extracting...
                    </>
                  ) : (
                    <>
                      <ScanText size={16} /> {isPdf ? "Run OCR on Full PDF" : "Extract Text (OCR)"}
                    </>
                  )}
                </button>
              )}

              {/* 🆕 Convert to Searchable PDF — same visibility rule as the OCR-text
                  button (scanned PDF page, or any image), since it's the same
                  underlying situation: "this content isn't machine-readable yet". */}
              {showOcrButton && (
                <button
                  onClick={generateSearchablePdf}
                  disabled={isGeneratingPdf}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  title="Original scan jaisa hi dikhega, bas text ab select/search bhi ho payega"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Converting...
                    </>
                  ) : (
                    <>
                      <FileCheck2 size={16} /> Convert to Searchable PDF
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 🆕 Searchable-PDF result banner */}
            {(isGeneratingPdf || pdfGenError || searchablePdfUrl) && (
              <div className="px-4 pb-3">
                {isGeneratingPdf && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <Loader2 size={16} className="animate-spin" />
                    Searchable PDF taiyar ho rahi hai — bade documents mein thoda time lag sakta hai...
                  </div>
                )}

                {!isGeneratingPdf && pdfGenError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    ⚠️ {pdfGenError}
                  </div>
                )}

                {!isGeneratingPdf && !pdfGenError && searchablePdfUrl && (
                  <div className="flex flex-wrap items-center gap-3 justify-between text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <span className="text-emerald-800 flex items-center gap-2">
                      <FileCheck2 size={16} /> Searchable PDF ready!
                    </span>
                    <div className="flex gap-2">
                      <a
                        href={searchablePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 border border-emerald-600 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition"
                      >
                        Preview
                      </a>
                      <a
                        href={searchablePdfUrl}
                        download={searchablePdfName || "searchable.pdf"}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: OCR result panel */}
          {showOcrPanel && (
            <div className="w-[340px] shrink-0 flex flex-col border-l border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700 text-sm">🔍 Extracted Text</h3>
                <button
                  onClick={() => setShowOcrPanel(false)}
                  className="text-gray-400 hover:text-red-500 text-lg leading-none"
                  title="Hide panel"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {isOcrLoading ? (
                  <p className="text-center text-indigo-600 text-sm py-6">⏳ Text extract ho raha hai...</p>
                ) : ocrError ? (
                  <p className="text-center text-red-500 text-sm py-6 px-2">{ocrError}</p>
                ) : (
                  <textarea
                    readOnly
                    value={ocrText}
                    onFocus={(e) => e.target.select()}
                    placeholder="OCR result yahan dikhega..."
                    className="w-full h-full min-h-[300px] border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed resize-none outline-none focus:border-indigo-400"
                  />
                )}
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={handleCopyOcr}
                  disabled={!ocrText}
                  className="flex-1 py-2 border border-indigo-600 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 disabled:opacity-40 disabled:border-gray-300 disabled:text-gray-400 transition flex items-center justify-center gap-1"
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={handleInsertOcr}
                  disabled={!ocrText}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Insert
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentScanner;