import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    console.log("🎤 Audio uploaded:", req.file.originalname);

    // Convert buffer into a temp file (OpenAI requires a file stream)
    const tempPath = `/tmp/${Date.now()}-${req.file.originalname}`;
    fs.writeFileSync(tempPath, req.file.buffer);

    // Call OpenAI transcription API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-audio-preview",  // correct model for transcription
      modalities: ["text"],
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              audio_url: `file://${tempPath}`,
            },
          ],
        },
      ],
    });

    const output = response.output_text;
    console.log("📝 Transcription:", output);

    res.json({
      success: true,
      text: output,
    });

  } catch (error) {
    console.error("🔥 AUDIO ERROR:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Audio transcription failed",
    });
  }
});

export default router;
