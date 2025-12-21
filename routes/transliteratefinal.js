import express from "express";
import OpenAI from "openai";

const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { text, sourceLang, targetScript } = req.body;
  if (!text || !targetScript) {
    return res.status(400).json({ error: "Text and targetScript are required." });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a transliteration assistant. Convert the following ${sourceLang || "text"} into ${targetScript} script.`,
        },
        { role: "user", content: text },
      ],
    });

    const transliterated = completion.choices[0].message.content;
    res.json({ transliteratedText: transliterated });
  } catch (error) {
    console.error("Backend Transliteration Error:", error.message);
    res.status(500).json({ error: "Transliteration failed", details: error.message });
  }
});

export default router;
