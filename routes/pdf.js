import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {

    console.log("PDF route hit");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const data = await pdfParse(req.file.buffer);

    const extractedText = data.text;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro"
    });

    const result = await model.generateContent(
      `Convert this PDF text into readable format:\n\n${extractedText}`
    );

    const response = await result.response;

    res.json({
      success: true,
      text: response.text()
    });

  } catch (error) {

    console.error("PDF ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;