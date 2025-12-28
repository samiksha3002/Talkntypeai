import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image uploaded" });
    }

    // Read uploaded file and convert to base64
    const fileData = fs.readFileSync(req.file.path);
    const base64 = fileData.toString("base64");

    // Correct OpenAI format for OCR
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",   // or "gpt-4o"
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text from this image." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64}`
              }
            }
          ]
        }
      ]
    });

    // Safely extract text
    const text = response.choices[0]?.message?.content || "";

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, text });
  } catch (err) {
    console.error("OCR Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
