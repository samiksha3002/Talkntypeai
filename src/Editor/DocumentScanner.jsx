import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ScanText, Copy, Plus, X, Loader2 } from "lucide-react";

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
 * Opens a PDF or image in a modal, exactly as before, but now:
 *  - Actually supports images (the old version only rendered PDFs even though
 *    the file input accepted "application/pdf, image/*").
 *  - Detects whether the current PDF page has a real, selectable text layer.
 *    A PDF "having text" doesn't guarantee it's *good* text — a scanned PDF
 *    can carry a garbled OCR layer baked in already — so both paths
 *    (select-to-insert AND run-OCR) stay available side by side.
 *  - Falls back to server-side OCR for scanned pages / images, with a
 *    results panel to copy or insert the extracted text.
 *
 * Props:
 *  - file        : File object (application/pdf or image/*)
 *  - onClose     : () => void
 *  - onInsertText: (text: string) => void
 *  - API         : string — backend base URL (same one EditorActions gets),
 *                  used to call POST `${API}/api/ocr/extract`.
 *                  Expected response shape: { text: string }
 *                  Adjust the endpoint/response parsing below to match your
 *                  actual backend route if it differs.
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

    if (isImage) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

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
  // 🟢 FIX: wired to the SAME endpoints editor.api.js already uses successfully
  // elsewhere (uploadOCR / uploadPDF) instead of a guessed "/api/ocr/extract"
  // route that doesn't exist on the backend — that mismatch was the 404.
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
            </div>
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