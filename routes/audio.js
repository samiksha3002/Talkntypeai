import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 1. Setup Multer (Keep file in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// 2. Initialize Deepgram Client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post("/audio-to-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log(`🎤 Deepgram Processing: ${req.file.originalname} (${req.file.mimetype})`);

    // 3. Send Buffer Directly to Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        mimetype: req.file.mimetype,
        model: "nova-2",
        language: "en",
        smart_format: true, // Auto-punctuates and formats numbers
        punctuate: true,
      }
    );

    if (error) {
      console.error("Deepgram API Error:", error);
      throw error;
    }

    // 4. Extract Transcript Safely
    // We use ?. (optional chaining) to prevent crashes if the audio was silent
    const transcript =
      result?.results?.channels[0]?.alternatives[0]?.transcript || "";

    console.log("✅ Deepgram Success!");
    res.json({ text: transcript });

  } catch (error) {
    console.error("❌ Transcription Error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

export default router;