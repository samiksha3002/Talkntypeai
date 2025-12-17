import express from "express";
import multer from "multer";
import fs from "fs";
// 1. Corrected Import: Use DeepgramClient for SDK v3+
import { DeepgramClient } from "@deepgram/sdk";

const router = express.Router();
// multer setup for handling file uploads
const upload = multer({ dest: "uploads/" });

// 2. Corrected Initialization: Use DeepgramClient with apiKey in an object
const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const filePath = req.file.path;
    const audioBuffer = fs.readFileSync(filePath);

    // 3. Corrected Method: Use deepgram.listen.prerecorded
    const response = await deepgram.listen.prerecorded(
      // Source: audio buffer and mimetype
      { buffer: audioBuffer, mimetype: req.file.mimetype },
      // Options: model and features
      { model: "nova-2", smart_format: true }
    );

    // Clean up the temporary file after transcription
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const transcript = response.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcript) {
      throw new Error("Deepgram returned no transcript.");
    }

    return res.json({ text: transcript });
  } catch (error) {
    console.error("Transcription Error:", error);

    // Ensure the temporary file is deleted even if transcription fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Return a 500 status with error details
    return res.status(500).json({ error: "Transcription failed", details: error.message });
  }
});

export default router;