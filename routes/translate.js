import express from "express";
import { v2 as Translate } from "@google-cloud/translate";

const router = express.Router();

// Initialize Google Cloud Translate client
const translate = new Translate.Translate({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // path to your JSON key
});

// POST /api/translate
router.post("/", async (req, res) => {
  console.log("Received body:", req.body);

  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Text and Target Language are required." });
  }

  try {
    const [translation] = await translate.translate(text, targetLang);
    res.json({ translatedText: translation });
  } catch (error) {
    console.error("Translation Error:", error);
    res.status(500).json({ error: "Translation failed", details: error.message });
  }
});

export default router;
