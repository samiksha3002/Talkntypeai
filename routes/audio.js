import express from "express";
import multer from "multer";
import { createClient } from "@deepgram/sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ---------- SETUP ----------
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Deepgram sirf in languages ke liye (explicitly select hone par)
const DEEPGRAM_LANGS = ["en", "hi"];

// Whisper ko style hint: language ke hisaab se, usi script me
const WHISPER_PROMPTS = {
  kn: "ಇದು ನ್ಯಾಯಾಲಯದ ಪ್ರಕರಣದ ಬಗ್ಗೆ ಧ್ವನಿಮುದ್ರಣ. ವಕೀಲರು, ಉಚ್ಚ ನ್ಯಾಯಾಲಯ, ಜಾಮೀನು, ಎಫ್‌ಐಆರ್, ಅರ್ಜಿದಾರ, ಪ್ರತಿವಾದಿ, ಅಫಿಡವಿಟ್.",
  mr: "हे न्यायालयीन प्रकरणाचे रेकॉर्डिंग आहे. वकील, उच्च न्यायालय, जामीन, एफआयआर, पोलीस ठाणे, अर्जदार, प्रतिवादी, प्रतिज्ञापत्र.",
  hi: "यह एक अदालती मामले की रिकॉर्डिंग है। वकील, उच्च न्यायालय, जमानत, एफआईआर, थाना, याचिकाकर्ता, प्रतिवादी, शपथ पत्र, धारा, आईपीसी।",
  en: "This is a recording about a court case. FIR, Section, IPC, CrPC, Advocate, High Court, Police Station, Bail, Petitioner, Respondent, Affidavit.",
  default:
    "Court case recording. FIR, Section, IPC, CrPC, Advocate, High Court, Bail, Petitioner, Respondent, Affidavit. ನ್ಯಾಯಾಲಯ, जामीन, वकील.",
};

const MIME_TO_EXT = {
  "audio/webm": "webm",
  "video/webm": "webm",
  "audio/ogg": "ogg",
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

// Filename me valid extension ensure karo (Whisper extension se format pehchanta hai)
function getFileInfo(file) {
  const type = (file.mimetype || "").split(";")[0].trim().toLowerCase();
  let name = file.originalname || "audio";
  if (!/\.(mp3|mp4|m4a|wav|webm|ogg|oga|flac|mpeg|mpga)$/i.test(name)) {
    name += "." + (MIME_TO_EXT[type] || "webm");
  }
  return { name, type: type || "audio/webm" };
}

// Multer errors ko JSON me return karo
const uploadAudioFile = (req, res, next) => {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      const msg =
        err.code === "LIMIT_FILE_SIZE"
          ? "File 10MB se badi hai, chhoti audio upload karo."
          : "File upload me error aaya.";
      return res.status(400).json({ success: false, error: msg });
    }
    next();
  });
};

// ---------- WHISPER ----------
async function transcribeWithWhisper(fileBuffer, fileInfo, langHint = "") {
  try {
    console.log("📤 Whisper engine call ho raha hai...");

    const params = {
      file: await OpenAI.toFile(fileBuffer, fileInfo.name, { type: fileInfo.type }),
      model: "whisper-1",
      prompt: WHISPER_PROMPTS[langHint] || WHISPER_PROMPTS.default,
      temperature: 0,
      response_format: "verbose_json",
    };

    // Language hint se accuracy kaafi badhti hai (kn, mr, hi, en)
    if (langHint) params.language = langHint;

    const result = await openai.audio.transcriptions.create(params);

    return {
      text: (result.text || "").trim(),
      language: result.language || langHint || "",
    };
  } catch (err) {
    console.error("❌ Whisper Error:", err.message);
    return null;
  }
}

// ---------- ROUTE ----------
router.post("/transcribe", uploadAudioFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No audio file uploaded" });
    }

    const fileInfo = getFileInfo(req.file);
    console.log(`🎤 Input: ${fileInfo.name} (${fileInfo.type}, ${req.file.size} bytes)`);

    // Frontend se optional language: "kn" | "mr" | "hi" | "en" | "" (auto)
    const langHint = (req.body?.language || "").toLowerCase().trim();

    let transcript = "";
    let detectedLanguage = langHint;
    let engine = "Deepgram";

    // Deepgram sirf tab, jab user ne explicitly en/hi select kiya ho.
    // Auto, Kannada, Marathi, sab seedha Whisper pe.
    const useDeepgram = DEEPGRAM_LANGS.includes(langHint);

    // --- STEP 1: DEEPGRAM (English / Hindi) ---
    if (useDeepgram) {
      try {
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
          req.file.buffer,
          {
            model: "nova-2",
            smart_format: true,
            language: langHint,
          }
        );

        if (error) {
          console.log("⚠️ Deepgram error:", error.message || error);
        } else {
          transcript =
            result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        }
      } catch (dgErr) {
        console.log("⚠️ Deepgram failed, Whisper pe ja rahe hain:", dgErr.message);
      }
    }

    // --- STEP 2: WHISPER (Kannada / Marathi / Auto / Deepgram fail / bahut chhota transcript) ---
    const needsWhisper = !useDeepgram || !transcript || transcript.trim().length < 15;

    if (needsWhisper) {
      const whisper = await transcribeWithWhisper(req.file.buffer, fileInfo, langHint);

      if (whisper?.text) {
        transcript = whisper.text;
        detectedLanguage = whisper.language || detectedLanguage;
        engine = "OpenAI Whisper";
      }
    }

    // --- FINAL RESPONSE ---
    if (!transcript || transcript.trim().length === 0) {
      return res.status(200).json({
        success: false,
        error: "Audio clear nahi hai ya voice detect nahi hui.",
      });
    }

    console.log(`✅ Completed with ${engine}`);
    return res.json({
      success: true,
      transcript: transcript.trim(),
      language: detectedLanguage || "auto",
      engine,
    });
  } catch (err) {
    console.error("🔥 Global Error:", err.message);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;