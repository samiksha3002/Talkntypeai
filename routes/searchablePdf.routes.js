/**
 * searchablePdf.routes.js
 *
 * Adds the two new endpoints the updated DocumentScanner.jsx calls:
 *   POST /api/ocr/image-to-searchable-pdf   (multipart field: "image")
 *   POST /api/ocr/pdf-to-searchable-pdf     (multipart field: "file")
 *
 * Both respond with `Content-Type: application/pdf` — the raw PDF bytes —
 * on success, or a JSON `{ error: "..." }` body on failure.
 *
 * HOW IT WORKS (the "OCR PDF" / searchable-PDF technique):
 *   1. Rasterize each page to a PNG (pdf-to-img does this for PDFs; images
 *      are used as-is).
 *   2. Run Tesseract OCR on each page image to get every recognized WORD
 *      plus its pixel bounding box (data.words[i].bbox).
 *   3. Build a new PDF with pdf-lib: draw the page's PNG as a full-page
 *      background image, then draw each recognized word as real PDF text
 *      at the same position — but with opacity 0. The page still LOOKS
 *      exactly like the original scan, but the invisible text underneath
 *      is what makes it selectable and searchable (Ctrl+F / copy-paste).
 *      This "image + invisible text" combo is sometimes called a
 *      "sandwich PDF" — it's the same approach iLovePDF / Adobe's
 *      SEARCHABLE_IMAGE_EXACT OCR mode use.
 *
 * INSTALL:
 *   npm install tesseract.js pdf-to-img pdf-lib multer
 *
 * MOUNT (in your main server file, next to your existing OCR routes):
 *   const searchablePdfRouter = require("./routes/searchablePdf.routes");
 *   app.use("/api/ocr", searchablePdfRouter);
 *
 * NOTE ON DEPLOYMENT (Render.com etc.):
 *   - tesseract.js downloads its language model (~15MB for "eng") the first
 *     time it runs and caches it — the very first request after a cold
 *     start will be slower. Consider bumping your request timeout for
 *     this route, or a "warm-up" call on server boot.
 *   - pdf-to-img renders pages via node canvas internally; on Render's
 *     standard Node buildpack this works out of the box with no extra
 *     system packages (no Ghostscript/ImageMagick needed, unlike pdf2pic).
 *   - Large multi-page PDFs OCR sequentially below to keep memory usage
 *     predictable; feel free to parallelize with Promise.all if your
 *     dyno has the RAM/CPU headroom.
 */

const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const { pdf: renderPdfToImages } = require("pdf-to-img");
const { PDFDocument, StandardFonts } = require("pdf-lib");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB, match your existing routes
});

// Pixels-per-inch used when rasterizing PDF pages to images. Higher = more
// accurate OCR, but slower and larger intermediate images. 200-300 is a
// good accuracy/speed tradeoff for text documents.
const RENDER_DPI = 200;
const RENDER_SCALE = RENDER_DPI / 72; // pdf-to-img's `scale` is relative to 72dpi PDF points

// One shared Tesseract worker, reused across requests instead of spinning a
// new one up (and re-downloading the language model) every single call.
let workerPromise = null;
async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng"); // add more languages here if needed, e.g. "eng+hin"
  }
  return workerPromise;
}

/**
 * OCRs a single page image and returns a new PDF page (added to `pdfDoc`)
 * showing that image with an invisible, positioned text layer on top.
 */
async function addSearchablePage(pdfDoc, font, worker, imageBuffer) {
  // 1. OCR the page image, with word-level bounding boxes.
  const { data } = await worker.recognize(imageBuffer);
  const words = data?.words || [];

  // 2. Embed the page image itself (try PNG, fall back to JPEG).
  let embeddedImage;
  try {
    embeddedImage = await pdfDoc.embedPng(imageBuffer);
  } catch {
    embeddedImage = await pdfDoc.embedJpg(imageBuffer);
  }
  const { width: imgWidthPx, height: imgHeightPx } = embeddedImage;

  // 3. Create a PDF page the same aspect ratio as the image, sized in
  //    points (72 per inch) based on the DPI we rendered at.
  const pageWidthPt = imgWidthPx / RENDER_SCALE;
  const pageHeightPt = imgHeightPx / RENDER_SCALE;
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  // 4. Draw the scanned image to fill the entire page.
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt,
  });

  // 5. Draw each recognized word as invisible (opacity 0) text, positioned
  //    and sized to match its bounding box from the OCR pass. Coordinates
  //    from Tesseract are pixel-based with (0,0) at the top-left; PDF
  //    coordinates are point-based with (0,0) at the bottom-left, so the
  //    y-axis has to be flipped.
  for (const word of words) {
    const text = word.text?.trim();
    if (!text) continue;

    const { x0, y0, x1, y1 } = word.bbox;
    const boxWidthPt = (x1 - x0) / RENDER_SCALE;
    const boxHeightPt = (y1 - y0) / RENDER_SCALE;
    if (boxWidthPt <= 0 || boxHeightPt <= 0) continue;

    const xPt = x0 / RENDER_SCALE;
    const yPt = pageHeightPt - y1 / RENDER_SCALE; // flip + use the box's bottom edge as baseline-ish anchor

    // Pick a font size that makes the invisible text's rendered width line
    // up reasonably well with the box width, so text-selection highlights
    // land in the right place. This is an approximation, not pixel-perfect.
    let fontSize = boxHeightPt * 0.85;
    const naturalWidth = font.widthOfTextAtSize(text, fontSize);
    if (naturalWidth > 0) {
      fontSize *= Math.min(1.4, Math.max(0.6, boxWidthPt / naturalWidth));
    }

    page.drawText(text, {
      x: xPt,
      y: yPt,
      size: fontSize,
      font,
      opacity: 0, // <-- the whole trick: text exists in the PDF but renders invisibly
    });
  }
}

/**
 * Shared handler: takes an array of page image buffers, OCRs each one,
 * and returns the finished searchable PDF as a Buffer.
 */
async function buildSearchablePdf(pageImageBuffers) {
  const worker = await getWorker();
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const imageBuffer of pageImageBuffers) {
    await addSearchablePage(pdfDoc, font, worker, imageBuffer);
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function sendPdfBuffer(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

// POST /api/ocr/image-to-searchable-pdf   (field: "image")
router.post("/image-to-searchable-pdf", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Koi image file nahi mili." });
  }

  try {
    const pdfBuffer = await buildSearchablePdf([req.file.buffer]);
    sendPdfBuffer(res, pdfBuffer, "searchable.pdf");
  } catch (err) {
    console.error("image-to-searchable-pdf failed:", err);
    res.status(500).json({ error: "Searchable PDF ban nahi paayi. Dobara try karein." });
  }
});

// POST /api/ocr/pdf-to-searchable-pdf   (field: "file")
router.post("/pdf-to-searchable-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Koi PDF file nahi mili." });
  }

  try {
    // Rasterize every page of the source PDF to a PNG buffer.
    const pageImages = [];
    const doc = await renderPdfToImages(req.file.buffer, { scale: RENDER_SCALE });
    for await (const pageImage of doc) {
      pageImages.push(pageImage); // already a PNG Buffer
    }

    if (pageImages.length === 0) {
      return res.status(400).json({ error: "PDF mein koi page nahi mila." });
    }

    const pdfBuffer = await buildSearchablePdf(pageImages);
    sendPdfBuffer(res, pdfBuffer, "searchable.pdf");
  } catch (err) {
    console.error("pdf-to-searchable-pdf failed:", err);
    res.status(500).json({ error: "Searchable PDF ban nahi paayi. Dobara try karein." });
  }
});

module.exports = router;