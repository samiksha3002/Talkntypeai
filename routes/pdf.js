import express from "express";
import multer from "multer";
import fs from "fs";
import * as pdfParseModule from "pdf-parse";   // ✅ import all
const pdfParse = pdfParseModule.default || pdfParseModule; // handle both cases

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    res.json({ success: true, text: pdfData.text });
  } catch (err) {
    console.error("PDF parse error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
