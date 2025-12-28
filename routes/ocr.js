import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image not provided" });
    }

    const base64Image = req.file.buffer.toString("base64");

    // Using GPT-4o Vision (Render-compatible method)
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this image:",
            },
            {
              type: "text",
              text: `data:image/png;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const text = result.choices[0].message.content;
    res.json({ success: true, text });

  } catch (error) {
    console.error("🔥 Render OCR Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "OCR failed",
    });
  }
});

export default router;
