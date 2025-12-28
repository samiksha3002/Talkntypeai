import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert PDF buffer to base64
    const pdfBase64 = req.file.buffer.toString("base64");

    // Call OpenAI Responses API
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Extract all text from this PDF.",
            },
            {
              type: "input_file",
              data: pdfBase64, // ✅ use "data" not "file"
              mime_type: "application/pdf",
            },
          ],
        },
      ],
    });

    console.log("🔵 PDF RAW RESPONSE:", JSON.stringify(response, null, 2));

    // Safely extract text from response
    let text = "";
    if (response.output_text) {
      text = response.output_text;
    } else if (
      response.output &&
      response.output[0] &&
      response.output[0].content &&
      response.output[0].content[0] &&
      response.output[0].content[0].text
    ) {
      text = response.output[0].content[0].text;
    }

    if (!text || text.trim() === "") {
      return res.json({ text: "", error: "No text extracted from PDF." });
    }

    res.json({ text });
  } catch (error) {
    console.error("PDF OCR Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
