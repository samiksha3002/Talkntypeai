import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Memory storage use kar rahe hain taaki server par file save na karni pade
const upload = multer();

// Deepgram Client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    // 1. File Check
    if (!req.file) {
      console.log("❌ No file received in request");
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    console.log(`🎤 Processing file: ${req.file.originalname} (${req.file.mimetype})`);

    // 2. Deepgram API Call
    // Naye SDK mein ye { result, error } return karta hai
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-2",      // Legal transcription ke liye best model
        smart_format: true,   // Punctuation aur Capitalization handle karega
        mimetype: req.file.mimetype,
        filler_words: false,  // "um", "uh" jaise words remove kar dega
      }
    );

    // 3. SDK level error check
    if (error) {
      console.error("❌ Deepgram SDK Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // 4. Log full result for debugging (Backend terminal mein dikhega)
    // console.log("🔍 Deepgram Full Result:", JSON.stringify(result, null, 2));

    // 5. Extract transcript safely
    // Check karein ki results exist karte hain ya nahi
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (transcript === undefined || transcript === null) {
      console.log("⚠️ No transcript found in Deepgram result");
      return res.status(200).json({ 
        success: false, 
        error: "No transcript returned",
        debug: result // Optional: frontend par debug data bhejne ke liye
      });
    }

    console.log("✅ Transcription successful!");
    
    // 6. Final Success Response
    res.json({ 
      success: true, 
      transcript: transcript.trim() 
    });

  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error", 
      details: err.message 
    });
  }
});

export default router;