import express from "express";
import { v2 } from "@google-cloud/translate";

const router = express.Router();
const { Translate } = v2;

// ✅ Initialize Google Cloud Translate client
// If GOOGLE_APPLICATION_CREDENTIALS points to a JSON file, use keyFilename.
// If you store JSON in an env var (e.g. GOOGLE_CLOUD_KEY), use credentials.
let translate;
try {
  if (process.env.GOOGLE_CLOUD_KEY) {
    // Render-friendly: JSON stored in env variable
    translate = new Translate({
      credentials: JSON.parse(process.env.GOOGLE_CLOUD_KEY),
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
  } else {
    // Local: path to JSON file
    translate = new Translate({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
} catch (err) {
  console.error("❌ Failed to initialize Translate client:", err);
}

// POST /api/translate
router.post("/", async (req, res) => {
  console.log("Received body:", req.body);

  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res
      .status(400)
      .json({ error: "Text and Target Language are required." });
  }

  try {
    if (!translate) {
      throw new Error("Translate client not initialized");
    }

    const [translation] = await translate.translate(text, targetLang);
    res.json({ translatedText: translation });
  } catch (error) {
    console.error("🔥 Translation Error:", error);
    res.status(500).json({
      error: "Translation failed",
      details: error.message,
    });
  }
});

export default router;
