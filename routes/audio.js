import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const upload = multer();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    console.log(`🎤 Processing: ${req.file.originalname}`);

    /**
     * SOLUTION: 
     * Marathi (mr) aur Gujarati (gu) ke liye hum "language" parameter ka use karenge.
     * Deepgram Nova-2 multi-language supports better when hinted.
     */
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: req.file.mimetype,
        filler_words: false,
        
        // 1. Pehle detect_language ko true rakhein
        detect_language: true, 

        // 2. IMPORTANT: Language list provide karein (Optional but recommended)
        // Agar auto-detect sirf Hindi kar raha hai, toh hum 'language' specify kar sakte hain.
        // Tip: Nova-2 works best with 'multi' or specific code if auto-detect fails.
        language: "multi", 
      }
    );

    if (error) {
      console.error("❌ Deepgram Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    const detectedLanguage = result?.results?.channels?.[0]?.detected_language;

    if (!transcript) {
      return res.status(200).json({ 
        success: false, 
        error: "Voice recognize nahi hui." 
      });
    }

    console.log(`✅ Success! Detected Language: ${detectedLanguage}`);

    res.json({ 
      success: true, 
      transcript: transcript.trim(),
      language: detectedLanguage 
    });

  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;