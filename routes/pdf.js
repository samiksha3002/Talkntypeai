
import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // ✅ Use a valid model name
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // ✅ Correct field name is inline_data
    const pdfData = {
      inline_data: {
        data: req.file.buffer.toString("base64"),
        mime_type: "application/pdf",
      },
    };

    const prompt = "Extract all the text from this PDF. Maintain the layout as much as possible.";
    const result = await model.generateContent([prompt, pdfData]);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text(),
    });

  } catch (error) {
    console.error("Gemini PDF Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
  