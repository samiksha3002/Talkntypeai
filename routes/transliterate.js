import express from "express";
import { TranslationServiceClient } from "@google-cloud/translate";

const router = express.Router();

// Initialize the v3 client
const client = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

router.post("/", async (req, res) => {
  const { text, sourceLang, targetLang, targetScript } = req.body;

  try {
    const projectId = process.env.GOOGLE_PROJECT_ID;

    if (!projectId) {
      return res.status(500).json({ error: "Missing GOOGLE_PROJECT_ID in .env" });
    }

    /**
     * FIX: Google v3 API fails with "INVALID_ARGUMENT" if sourceLang === targetLang.
     * We bypass this by setting a different target language. 
     * The 'transliterationConfig' will still ensure the script is converted correctly.
     */
    let effectiveTargetLang = targetLang;
    if (sourceLang === targetLang) {
      effectiveTargetLang = sourceLang === "hi" ? "en" : "hi";
    }

    const request = {
      // Correct path format for v3
      parent: `projects/${projectId}/locations/global`,
      contents: [text],
      sourceLanguageCode: sourceLang,
      targetLanguageCode: effectiveTargetLang, 
      transliterationConfig: {
        targetScriptCode: targetScript, // 'Latn' for Roman, 'Deva' for Hindi
      },
    };

    console.log(`Transliterating for project: ${projectId}...`);

    const [response] = await client.translateText(request);

    if (response.translations && response.translations.length > 0) {
      res.json({
        transliteratedText: response.translations[0].translatedText
      });
    } else {
      res.status(500).json({ error: "Empty response from Google" });
    }
  } catch (error) {
    console.error("Backend Transliteration Error:", error.message);
    res.status(500).json({ 
      error: "Transliteration failed", 
      details: error.message 
    });
  }
});

export default router;