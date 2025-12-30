import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const upload = multer();

// Deepgram Client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// POST request on /api/audio/transcribe (kyunki server.js mein prefix set hai)
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: req.file.mimetype,
      }
    );

    if (error) throw error;

    res.json({
      success: true,
      transcript: result.results.channels[0].alternatives[0].transcript,
    });
  } catch (err) {
    console.error("Deepgram Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;