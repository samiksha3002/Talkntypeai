import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Setup Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // --- CRITICAL FIX: Direct Loading ---
    let parsePdf;
    try {
      // Direct path to the library file is the most stable way in ES Modules
      parsePdf = require("pdf-parse/lib/pdf-parse.js");
    } catch (e) {
      console.error("PDF-PARSE LOAD ERROR:", e.message);
      // Fallback to standard require if path fails
      const mod = require("pdf-parse");
      parsePdf = typeof mod === 'function' ? mod : mod.default;
    }

    if (typeof parsePdf !== 'function') {
      throw new Error("The pdf-parse library could not be loaded as a function. Please ensure 'npm install pdf-parse' was run.");
    }

    console.log("Processing PDF:", req.file.originalname);

    // 1. Parse the buffer
    const data = await parsePdf(req.file.buffer);
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
       throw new Error("This PDF contains no selectable text (it might be a scan). Please use Image to Text.");
    }

    // 2. Format with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Format this legal/text content professionally with Markdown:\n\n${extractedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text(),
      pages: data.numpages
    });

  } catch (error) {
    console.error("FULL SERVER ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error during PDF processing"
    });
  }
});

export default router;