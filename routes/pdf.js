import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// --- SMART FIX STARTS HERE ---
const pdfModule = require("pdf-parse");
// Sometimes require returns the function directly, 
// sometimes it's inside a .default property. This covers both:
const parsePdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
// --- SMART FIX ENDS HERE ---

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log("Processing PDF:", req.file.originalname);

    // Use our 'parsePdf' variable which we validated above
    if (typeof parsePdf !== 'function') {
        throw new Error("pdf-parse module failed to load correctly as a function.");
    }

    const data = await parsePdf(req.file.buffer);

    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
       throw new Error("PDF appears to be empty or contains only images (OCR required).");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Convert this PDF text into a structured, highly readable format. 
    Maintain the original meaning but use headings and bullet points where appropriate:\n\n${extractedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text(),
      pages: data.numpages
    });

  } catch (error) {
    console.error("PDF Processing Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during PDF processing"
    });
  }
});

export default router;