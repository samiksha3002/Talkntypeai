import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use disk storage for compatibility with OpenAI's file stream
const upload = multer({ dest: "/tmp" });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No audio file provided",
      });
    }

    console.log("🎤 Audio uploaded:", req.file.originalname);

    // Create readable stream from uploaded file
    const audioStream = fs.createReadStream(req.file.path);

    // Call OpenAI Whisper transcription API
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      response_format: "json",
    });

    console.log("📝 Transcription:", response.text);

    res.json({
      success: true,
      text: response.text,
    });

    // Clean up temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("🧹 Cleanup error:", err);
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
