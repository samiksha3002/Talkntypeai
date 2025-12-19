import express from "express";
import { TranslationServiceClient } from "@google-cloud/translate";

const router = express.Router();

// 1. Initialize client using the JSON string from Render Environment Variables
let clientOptions = {};

try {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    // Parse the string into a JSON object
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    clientOptions = { credentials };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Fallback for local development using a file path
    clientOptions = { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  }
} catch (err) {
  console.error("Failed to parse GOOGLE_CREDENTIALS_JSON:", err.message);
}

const client = new TranslationServiceClient(clientOptions);

router.post("/", async (req, res) => {
  const { text, sourceLang, targetLang, targetScript } = req.body;

  try {
    // 2. Extract Project ID directly from the credentials or Env
    const credentials = process.env.GOOGLE_CREDENTIALS_JSON 
      ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) 
      : null;
    
    const projectId = credentials?.project_id || process.env.GOOGLE_PROJECT_ID;

    if (!projectId) {
      return res.status(500).json({ error: "Missing Project ID configuration" });
    }

    /**
     * Google v3 API fails if sourceLang === targetLang.
     * Transliteration handles script change regardless of the language code.
     */
    let effectiveTargetLang = targetLang || (sourceLang === "hi" ? "en" : "hi");
    if (sourceLang === effectiveTargetLang) {
      effectiveTargetLang = sourceLang === "hi" ? "en" : "hi";
    }

    const request = {
      parent: `projects/${projectId}/locations/global`,
      contents: [text],
      mimeType: "text/plain", // Ensures HTML tags aren't broken
      sourceLanguageCode: sourceLang || "hi",
      targetLanguageCode: effectiveTargetLang,
      transliterationConfig: {
        targetScriptCode: targetScript || "Latn", 
      },
    };

    console.log(`Transliterating in project ${projectId} to script: ${targetScript}`);

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