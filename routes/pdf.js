import express from "express";
import multer from "multer";
import PDFParser from "pdf2json"; // New library

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper function to wrap pdf2json in a Promise (makes it async/await compatible)
const parsePDFBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1); // 1 = Text content only

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      // The raw data is complex, we need to extract the text lines safely
      try {
        const rawText = pdfParser.getRawTextContent();
        resolve(rawText);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
};

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`Processing with pdf2json: ${req.file.originalname}`);

    // --- EXECUTE NEW PARSER ---
    const extractedText = await parsePDFBuffer(req.file.buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        error: "No text found. PDF might be a scanned image." 
      });
    }

    console.log("✅ Success! Text length:", extractedText.length);

    res.json({
      filename: req.file.originalname,
      text: extractedText,
    });

  } catch (error) {
    console.error("❌ PDF ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;