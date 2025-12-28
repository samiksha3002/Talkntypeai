import express from "express";
import multer from "multer";
import OpenAI from "openai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image not provided" });
    }

    const base64Image = req.file.buffer.toString("base64");

    // 🔥 New Vision API method
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all text from this image clearly." },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const extractedText = result.choices[0]?.message?.content || "";

    res.json({
      success: true,
      text: extractedText,
    });

  } catch (error) {
    console.error("🔥 OCR Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "OCR processing failed",
    });
  }
});

export default router;
