import express from "express";
import multer from "multer";

// 👇 FIX: Import 'createRequire' to load CommonJS modules like pdf-parse
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = express.Router();

// 20MB Limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📄 Processing PDF: ${req.file.originalname}`);

    // ✅ pdf-parse use (No changes needed in logic here)
    const data = await pdfParse(req.file.buffer);

    const extractedText = data.text;
    const totalPages = data.numpages;

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        error: "No text found. This might be a scanned PDF (Image). Please use OCR for this file." 
      });
    }

    console.log(`✅ Success! Extracted ${totalPages} pages. Text length: ${extractedText.length}`);

    res.json({
      success: true,
      filename: req.file.originalname,
      totalPages: totalPages,
      text: extractedText,
    });

  } catch (error) {
    console.error("❌ PDF Parsing Error:", error);
    res.status(500).json({ error: "Failed to parse PDF. File might be corrupted or encrypted." });
  }
});

export default router;