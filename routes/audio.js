import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Gemini Import
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const upload = multer();
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HELPER: GEMINI TRANSCRIPTION FUNCTION ---
async function transcribeWithGemini(fileBuffer, mimetype) {
  try {
   const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType: mimetype,
        },
      },
      { text: "You are a legal stenographer. Transcribe this audio accurately. Detect the language automatically (Marathi, Hindi, or English). Provide only the transcript text." },
    ]);
    
    return result.response.text();
  } catch (err) {
    console.error("❌ Gemini Error:", err);
    return null;
  }
}

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    console.log(`🎤 Processing: ${req.file.originalname} (${req.file.mimetype})`);

    // --- STEP 1: TRY DEEPGRAM FIRST ---
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: req.file.mimetype,
        detect_language: true,
      }
    );

    let transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    let detectedLanguage = result?.results?.channels?.[0]?.detected_language;
    let engine = "Deepgram";

    // --- STEP 2: FALLBACK TO GEMINI (If Marathi or if Deepgram fails) ---
    // Agar Deepgram ko samajh nahi aaya, ya language Marathi (mr) hai 
    // toh Gemini behtar result dega noise mein.
    if (!transcript || transcript.length < 5 || detectedLanguage === "mr") {
      console.log("🔄 Deepgram insufficient for this audio. Switching to Gemini...");
      const geminiText = await transcribeWithGemini(req.file.buffer, req.file.mimetype);
      
      if (geminiText) {
        transcript = geminiText;
        engine = "Gemini (High Accuracy)";
        detectedLanguage = "multi/detected";
      }
    }

    if (!transcript) {
      return res.status(200).json({ 
        success: false, 
        error: "Voice recognize nahi hui kisi bhi engine se." 
      });
    }

    console.log(`✅ Success! Engine: ${engine} | Language: ${detectedLanguage}`);

    res.json({ 
      success: true, 
      transcript: transcript.trim(),
      language: detectedLanguage,
      engine: engine 
    });

  } catch (err) {
    console.error("🔥 Server Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;