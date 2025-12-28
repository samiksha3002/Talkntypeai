import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();

// Store file temporarily
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

    // 🔥 NEW OpenAI Whisper API (2025 format)
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-mini-transcribe", // Whisper successor
    });

    // Remove temp audio file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      text: response.text || "",
    });

  } catch (error) {
    console.error("🔥 AUDIO Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Audio transcription failed",
    });
  }
});

export default router;
