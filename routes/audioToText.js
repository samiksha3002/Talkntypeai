import express from "express";
import multer from "multer";
import fs from "fs";
import { createClient } from '@deepgram/sdk';

const router = express.Router();

// Setup Multer to store uploaded audio files temporarily
const upload = multer({ dest: "uploads/" });

// NOTE: Ensure your DEEPGRAM_API_KEY is set in the .env file
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// POST /api/audio-to-text
router.post("/", upload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        const filePath = req.file.path;

        // Read audio file
        const audioBuffer = fs.readFileSync(filePath);

        // Send to Deepgram for transcription
        const response = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
            model: "nova-2",
            // You might want to add other options like punctuation, diarization, etc.
            // smart_format: true, 
        });

        // Delete uploaded file after transcription
        fs.unlinkSync(filePath);

        // Ensure the response path is correct based on Deepgram SDK output
        const transcript = response.result?.results?.channels[0]?.alternatives[0]?.transcript;

        if (!transcript) {
             // Handle case where transcription was empty or failed internally
             throw new Error("Deepgram returned no transcript.");
        }

        return res.json({
            text: transcript
        });

    } catch (error) {
        console.error("Deepgram or File System Error:", error); // Use console.error for errors
        
        // Clean up file if it exists and transcription failed
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ error: "Transcription failed", details: error.message });
    }
});

export default router;