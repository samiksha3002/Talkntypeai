
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const router = express.Router();

// ---------------- CONFIGURATION ----------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

const SUPPORTED_LANGUAGES = ["kn", "mr", "hi", "en"];

const LANGUAGE_ALIASES = {
  kannada: "kn",
  marathi: "mr",
  hindi: "hi",
  english: "en",
  "kn-in": "kn",
  "mr-in": "mr",
  "hi-in": "hi",
  "en-in": "en",
};

// Language-specific legal vocabulary hints.
// These hints help Whisper recognize legal terminology.
const WHISPER_PROMPTS = {
  kn: "ನ್ಯಾಯಾಲಯ, ವಕೀಲರು, ಉಚ್ಚ ನ್ಯಾಯಾಲಯ, ಜಾಮೀನು, ಎಫ್‌ಐಆರ್, ಅರ್ಜಿದಾರ, ಪ್ರತಿವಾದಿ, ಅಫಿಡವಿಟ್, ಪೊಲೀಸ್ ಠಾಣೆ.",

  mr: "न्यायालय, वकील, उच्च न्यायालय, जामीन, एफआयआर, अर्जदार, प्रतिवादी, प्रतिज्ञापत्र, पोलीस ठाणे.",

  hi: "न्यायालय, वकील, उच्च न्यायालय, जमानत, एफआईआर, याचिकाकर्ता, प्रतिवादी, शपथ पत्र, पुलिस थाना, धारा.",

  en: "Court case, Advocate, High Court, Bail, FIR, Petitioner, Respondent, Affidavit, Police Station, Legal Sections.",
};

// ---------------- FILE INFORMATION ----------------

const MIME_TO_EXT = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
  "application/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/flac": "flac",
  "video/mp4": "mp4",
};

function getFileInfo(file) {
  const mimeType = (file.mimetype || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  const originalExt = path.extname(file.originalname || "")
    .toLowerCase()
    .replace(".", "");

  const extension =
    MIME_TO_EXT[mimeType] || originalExt || "webm";

  return {
    name: `recording.${extension}`,
    type: mimeType || "audio/webm",
  };
}

// ---------------- LANGUAGE NORMALIZATION ----------------

function normalizeLanguage(language) {
  const value = (language || "")
    .toLowerCase()
    .trim();

  if (!value || value === "auto") {
    return "";
  }

  return LANGUAGE_ALIASES[value] || value.split("-")[0];
}

function normalizeDetectedLanguage(language) {
  const value = (language || "").toLowerCase().trim();

  const detected = LANGUAGE_ALIASES[value] || value;

  if (SUPPORTED_LANGUAGES.includes(detected)) {
    return detected;
  }

  return detected || "auto";
}

// ---------------- MULTER ERROR HANDLING ----------------

const uploadAudioFile = (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Audio file 10MB se badi hai. Please upload a smaller file."
          : "Audio upload failed.";

      return res.status(400).json({
        success: false,
        error: message,
      });
    }

    next();
  });
};

// ---------------- WHISPER TRANSCRIPTION ----------------

async function transcribeWithWhisper(file, language) {
  const fileInfo = getFileInfo(file);

  console.log("Whisper transcription started");
  console.log("Audio:", fileInfo.name);
  console.log("Selected language:", language || "Auto Detection");

  const audioFile = await OpenAI.toFile(
    file.buffer,
    fileInfo.name,
    {
      type: fileInfo.type,
    }
  );

  const params = {
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    temperature: 0,
  };

  // Explicit language selection
  // If auto is selected, Whisper detects the language.
  if (language) {
    params.language = language;

    if (WHISPER_PROMPTS[language]) {
      params.prompt = WHISPER_PROMPTS[language];
    }
  }

  const result = await openai.audio.transcriptions.create(params);

  return {
    text: (result.text || "").trim(),
    language: normalizeDetectedLanguage(
      language || result.language
    ),
  };
}

// ---------------- TRANSCRIPTION ROUTE ----------------

router.post(
  "/transcribe",
  uploadAudioFile,
  async (req, res) => {
    try {
      // Check API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "OpenAI API key is missing.",
        });
      }

      // Check uploaded file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No audio file uploaded.",
        });
      }

      // Get selected language
      const language = normalizeLanguage(
        req.body?.language
      );

      // Validate language
      if (
        language &&
        !SUPPORTED_LANGUAGES.includes(language)
      ) {
        return res.status(400).json({
          success: false,
          error: "Unsupported language selected.",
        });
      }

      // Transcribe audio
      const transcription = await transcribeWithWhisper(
        req.file,
        language
      );

      if (!transcription.text) {
        return res.status(200).json({
          success: false,
          error: "No clear speech detected. Please try again.",
        });
      }

      console.log("Transcription completed successfully");
      console.log("Detected language:", transcription.language);

      return res.status(200).json({
        success: true,
        transcript: transcription.text,
        language: transcription.language,
        engine: "OpenAI Whisper",
      });

    } catch (error) {
      console.error(
        "Transcription Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        error:
          "Audio transcription failed. Please try again.",
      });
    }
  }
);

export default router;
