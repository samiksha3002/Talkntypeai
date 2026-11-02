
import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Multer Configuration (10 MB limit)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
});

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supported languages
const SUPPORTED_LANGUAGES = {
  hi: "Hindi",
  mr: "Marathi",
  kn: "Kannada",
  en: "English",
};

// Language-specific prompts
const LANGUAGE_PROMPTS = {
  kn: `ಈ ಆಡಿಯೊ ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿದೆ.
ದಯವಿಟ್ಟು ಮಾತನಾಡಿದ ಪ್ರತಿಯೊಂದು ಪದವನ್ನೂ ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ
ಯಥಾವತ್ತಾಗಿ ಬರೆಯಿರಿ. ಭಾಷಾಂತರ ಮಾಡಬೇಡಿ.
ಕಾನೂನು ಪದಗಳು: FIR, IPC, CrPC, BNS, BNSS,
Advocate, High Court, Police Station, Bail,
Petitioner, Respondent, Affidavit.`,

  mr: `This is a Marathi legal recording.
Transcribe exactly in Devanagari script.
Do not translate. Legal terms: FIR, IPC, CrPC,
BNS, BNSS, Advocate, High Court, Bail.`,

  hi: `This is a Hindi legal recording.
Transcribe exactly in Devanagari script.
Do not translate. Legal terms: FIR, IPC, CrPC,
BNS, BNSS, Advocate, High Court, Bail.`,

  en: `This is an English legal recording.
Transcribe exactly as spoken.
Legal terms: FIR, IPC, CrPC, BNS, BNSS,
Advocate, High Court, Bail, Petitioner, Respondent.`,
};

// OpenAI Whisper transcription
async function transcribeWithWhisper(fileBuffer, originalName, language) {
  try {
    console.log(`📤 Whisper transcription started: ${language || "Auto"}`);

    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(fileBuffer, originalName),
      model: "whisper-1",

      ...(SUPPORTED_LANGUAGES[language]
        ? { language }
        : {}),

      prompt:
        LANGUAGE_PROMPTS[language] ||
        `This is a legal recording. Transcribe exactly as spoken.
         Preserve the original language and script.
         Legal terms: FIR, IPC, CrPC, BNS, BNSS,
         Advocate, High Court, Bail, Petitioner,
         Respondent, Affidavit.`,

      temperature: 0,
    });

    return transcription.text?.trim() || null;

  } catch (err) {
    console.error("❌ Whisper Error:", err.message);
    return null;
  }
}

// POST /transcribe
router.post(
  "/transcribe",
  upload.single("audio"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file uploaded",
        });
      }

      console.log(`🎤 Input: ${req.file.originalname}`);

      // Frontend can send: language = kn, hi, mr, en
      const requestedLanguage = (
        req.body.language || ""
      ).toLowerCase().trim();

      if (
        requestedLanguage &&
        !SUPPORTED_LANGUAGES[requestedLanguage]
      ) {
        return res.status(400).json({
          success: false,
          error: "Unsupported language",
          supportedLanguages: SUPPORTED_LANGUAGES,
        });
      }

      let transcript = "";
      let detectedLanguage = requestedLanguage;
      let engine = "";

      // STEP 1: Kannada - Direct Whisper transcription
      // This ensures Kannada language is explicitly specified.

      if (requestedLanguage === "kn") {
        console.log("🔄 Kannada detected. Using Whisper...");

        transcript = await transcribeWithWhisper(
          req.file.buffer,
          req.file.originalname,
          "kn"
        );

        engine = "OpenAI Whisper (Kannada)";

      } else {
        // STEP 2: Deepgram for other languages

        try {
          const { result, error } =
            await deepgram.listen.prerecorded.transcribeFile(
              req.file.buffer,
              {
                model: "nova-2",
                smart_format: true,
                mimetype: req.file.mimetype,
                detect_language: true,
              }
            );

          if (!error) {
            transcript =
              result?.results?.channels?.[0]
                ?.alternatives?.[0]?.transcript || "";

            detectedLanguage =
              result?.results?.channels?.[0]
                ?.detected_language || requestedLanguage;

            engine = "Deepgram Nova-2";
          }

        } catch (dgErr) {
          console.log(
            "⚠️ Deepgram failed. Switching to Whisper."
          );
        }

        // STEP 3: Whisper fallback

        const needsBetterAccuracy =
          !transcript ||
          transcript.length < 15 ||
          detectedLanguage === "mr" ||
          detectedLanguage === "kn";

        if (needsBetterAccuracy) {
          console.log("🔄 Calling Whisper fallback...");

          const whisperText = await transcribeWithWhisper(
            req.file.buffer,
            req.file.originalname,
            detectedLanguage
          );

          if (whisperText) {
            transcript = whisperText;
            engine = "OpenAI Whisper (High Accuracy)";
          }
        }
      }

      // STEP 4: Final response

      if (!transcript || !transcript.trim()) {
        return res.status(200).json({
          success: false,
          error: "Audio clear nahi hai ya voice detect nahi hui.",
        });
      }

      console.log(`✅ Completed with ${engine}`);

      return res.json({
        success: true,
        transcript,
        language: detectedLanguage || "multi",
        languageName:
          SUPPORTED_LANGUAGES[detectedLanguage] || "Auto Detected",
        engine,
      });

    } catch (err) {
      console.error("🔥 Global Error:", err.message);

      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  }
);

export default router;
