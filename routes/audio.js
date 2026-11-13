import { aiBudget, job, setting, inspectAudio } from '../utils/resourceProtection.js';

import express from "express";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const router = express.Router();
router.use(...aiBudget);

// ---------------- CONFIGURATION ----------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, timeout: 180000, maxRetries: 0,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: setting("AUDIO_UPLOAD_MB",10) * 1024 * 1024, files:1, fields:20, fieldSize:1024*1024, parts:21, // 10 MB
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
  req.resource?.begin();
  upload.single("audio")(req, res, (err) => {
    if (err) {
      req.resource?.release();
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Audio exceeds the configured upload size limit."
          : "Audio upload failed.";

      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        error: message,
      });
    }

    if(req.resource?.signal.aborted){req.resource.release();return;}
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
  job(async (req, res) => {
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
      if (!/^(audio\/|video\/(webm|mp4)|application\/ogg)/i.test(req.file.mimetype)) return res.status(415).json({success:false,error:"Unsupported audio type."});
      inspectAudio(req.file.buffer);
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

      return res.status(error.resourceProtection ? error.status : 500).json({
        success: false,
        error: error.resourceProtection ? error.message :
          "Audio transcription failed. Please try again.",
      });
    }
  })
);

export default router;
