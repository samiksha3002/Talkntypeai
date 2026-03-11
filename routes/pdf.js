import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

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

    console.log("PDF received:", req.file.originalname);

    const data = await pdfParse(req.file.buffer);

    const extractedText = data.text;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });

    const result = await model.generateContent(
      `Convert this PDF text into structured readable format:\n\n${extractedText}`
    );

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
      error: error.message
    });

  }
});

export default router;