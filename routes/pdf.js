import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// FIX: Often pdf-parse requires accessing the base module or its default
const pdf = require("pdf-parse"); 

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    console.log("Processing PDF:", req.file.originalname);

    // FIX: Use the 'pdf' variable directly as the function
    // We pass the buffer directly from multer memoryStorage
    const data = await pdf(req.file.buffer);

    const extractedText = data.text;

    // Safety check: If PDF is an image-based scan, text might be empty
    if (!extractedText || extractedText.trim().length === 0) {
       throw new Error("PDF appears to be empty or contains only images (OCR required).");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash" // Flash is faster/cheaper for text structuring
    });

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