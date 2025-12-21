// routes/chattranslate.js
import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Initialize OpenAI client with your API key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Text and Target Language are required." });
  }

  try {
    // Ask ChatGPT to translate
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // lightweight model, you can use "gpt-4o" too
      messages: [
        {
          role: "system",
          content: `You are a translation assistant. Translate the following text into ${targetLang}.`,
        },
        { role: "user", content: text },
      ],
    });

    const translation = completion.choices[0].message.content;
    res.json({ translatedText: translation });
  } catch (error) {
    console.error("ChatTranslate Error:", error);
    res.status(500).json({ error: "Translation failed", details: error.message });
  }
});

export default router;
