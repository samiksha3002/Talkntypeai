import express from "express";
import { TranslationServiceClient } from "@google-cloud/translate";

const router = express.Router();
const client = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const request = {
      parent: `projects/${process.env.GCLOUD_PROJECT}/locations/global`,
      contents: [text],
      sourceLanguageCode: "en",   // input is English
      targetLanguageCode: "hi",   // translate to Hindi
      transliterationConfig: {
        targetScriptCode: "Latn", // Roman script output
      },
    };

    const [response] = await client.translateText(request);
    res.json({ transliteratedText: response.translations[0].translatedText });
  } catch (error) {
    console.error("Transliteration Error:", error);
    res.status(500).json({ error: "Transliteration failed", details: error.message });
  }
});

export default router;
