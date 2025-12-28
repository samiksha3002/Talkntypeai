import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();

// Temp file storage
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/audio-to-text", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Audio file not provided",
      });
    }

    const filePath = req.file.path;

    // ✅ CORRECT MODEL + METHOD (2025)
    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-transcribe",   // ✔ Whisper replacement
    });

    fs.unlinkSync(filePath); // cleanup

    return res.json({
      success: true,
      text: result.text || "",
    });

  } catch (error) {
    console.error("🔥 AUDIO Error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Audio transcription failed",
    });
  }
});

export default router;
