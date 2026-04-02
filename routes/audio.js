import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import OpenAI from "openai"; // OpenAI Import
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Multer Configuration (10MB limit)
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// OpenAI Initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is in your .env
});

// --- HELPER: OPENAI WHISPER TRANSCRIPTION ---
// --- HELPER: OPENAI WHISPER TRANSCRIPTION (HIGH PRECISION) ---
async function transcribeWithWhisper(fileBuffer, originalName) {
  try {
    console.log("📤 Requesting High-Precision Whisper Engine...");

    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(fileBuffer, originalName),
      model: "whisper-1",
      // --- YEH HAI JADU (PROMPT) ---
      // Isme humne saare legal keywords daal diye hain taaki AI unhe pehchaane
      prompt: "This is a legal recording regarding a court case. Keywords: FIR, Section, IPC, CrPC, Advocate, High Court, Police Station, Bail, Divorce, Maintenance, Petitioner, Respondent, Affidavit, Marathi, Hindi. Please provide exact word-for-word transcription in Devanagari script for Marathi and Hindi.",
      
      // Temperature 0 ka matlab hai "No Guessing". Jo suna wahi likho.
      temperature: 0, 
    });

    return transcription.text.trim();
  } catch (err) {
    console.error("❌ Whisper Precision Error:", err.message);
    return null;
  }
}
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    console.log(`🎤 Input: ${req.file.originalname}`);

    let transcript = "";
    let detectedLanguage = "";
    let engine = "Deepgram";

    // --- STEP 1: DEEPGRAM (Fast & Smart) ---
    try {
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        req.file.buffer,
        {
          model: "nova-2",
          smart_format: true,
          mimetype: req.file.mimetype,
          detect_language: true,
        }
      );

      if (!error) {
        transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
        detectedLanguage = result?.results?.channels?.[0]?.detected_language;
      }
    } catch (dgErr) {
      console.log("⚠️ Deepgram connection failed, moving to Whisper.");
    }

    // --- STEP 2: LOGIC BASED FALLBACK (Marathi & Noise Fix) ---
    // Rule: Agar Marathi (mr) hai, ya transcript bahut chota hai (< 15 chars)
    const needsBetterAccuracy = !transcript || transcript.length < 15 || detectedLanguage === 'mr';

    if (needsBetterAccuracy) {
      console.log("🔄 Better accuracy needed for Marathi/Noise. Calling Whisper...");
      
      const whisperText = await transcribeWithWhisper(req.file.buffer, req.file.originalname);
      
      if (whisperText) {
        transcript = whisperText;
        engine = "OpenAI Whisper (High Accuracy)";
      }
    }

    // --- FINAL RESPONSE ---
    if (!transcript || transcript.trim().length === 0) {
      return res.status(200).json({ 
        success: false, 
        error: "Audio clear nahi hai ya voice detect nahi hui." 
      });
    }

    console.log(`✅ Completed with ${engine}`);
    res.json({ 
      success: true, 
      transcript: transcript,
      language: detectedLanguage || "multi",
      engine: engine 
    });

  } catch (err) {
    console.error("🔥 Global Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;