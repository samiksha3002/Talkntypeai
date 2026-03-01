import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Initialize the model (Gemini 1.5 Flash is fast and cheap/free)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Prepare the PDF data for Gemini
    const pdfData = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };

    // 3. Ask Gemini to extract the text
    const prompt = "Extract all the text from this PDF. Maintain the layout as much as possible.";
    const result = await model.generateContent([prompt, pdfData]);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text(),
    });

  } catch (error) {
    console.error("Gemini PDF Error:", error);
    res.status(500).json({ success: false, error: "AI processing failed" });
  }
});

export default router;