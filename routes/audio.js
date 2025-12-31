import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Memory storage use kar rahe hain
const upload = multer();

// Deepgram Client initialize karein
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    // 1. File validation
    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    console.log(`🎤 Processing: ${req.file.originalname} | Auto-detecting language...`);

    // 2. Deepgram API Call with AUTO-DETECT
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-2",       // Fast and supports many languages
        smart_format: true,    // Punctuation handle karega
        mimetype: req.file.mimetype,
        filler_words: false,
        
        // ✅ AUTO-DETECTION SETTINGS
        detect_language: true, // Isse Deepgram khud pehchanega ki Hindi hai, Marathi ya English
      }
    );

    // 3. Error check
    if (error) {
      console.error("❌ Deepgram Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // 4. Results extract karein
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    // Deepgram batata hai ki usne kaunsi language detect ki
    const detectedLanguage = result?.results?.channels?.[0]?.detected_language;

    if (!transcript) {
      console.log("⚠️ No transcript found");
      return res.status(200).json({ 
        success: false, 
        error: "Voice recognize nahi hui. Kya audio clear hai?" 
      });
    }

    console.log(`✅ Success! Detected Language: ${detectedLanguage}`);

    // 5. Final Response
    res.json({ 
      success: true, 
      transcript: transcript.trim(),
      language: detectedLanguage // Frontend ko bata rahe hain kya detect hua
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