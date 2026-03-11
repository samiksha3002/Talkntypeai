import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const router = express.Router();

// Multer Memory Storage is best for Render
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

    // --- DYNAMIC MODULE LOADING ---
    let parsePdf;
    try {
      // We try the standard require first
      const mod = require("pdf-parse");
      parsePdf = typeof mod === 'function' ? mod : mod.default;
      
      // If still not a function, try the direct path (Common in ES Modules)
      if (typeof parsePdf !== 'function') {
        parsePdf = require("pdf-parse/lib/pdf-parse.js");
      }
    } catch (e) {
      console.error("Module Load Error:", e);
      return res.status(500).json({ 
        success: false, 
        error: "Library 'pdf-parse' not found on server. Run 'npm install pdf-parse'." 
      });
    }

    console.log("Processing PDF:", req.file.originalname);

    // 1. Parse PDF to Raw Text
    const data = await parsePdf(req.file.buffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
       throw new Error("This PDF seems to be an image/scan. Please use 'Image to Text' instead.");
    }

    // 2. Use Gemini to structure the messy raw text
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract and structure the following text from a PDF. 
      Make it clean, professional, and maintain the original legal/document context.
      Use Markdown (headers, bolding, lists) for better readability.
      
      TEXT:
      ${extractedText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text(),
      pages: data.numpages
    });

  } catch (error) {
    console.error("PDF Route Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during PDF processing"
    });
  }
});

export default router;