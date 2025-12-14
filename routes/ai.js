import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate-draft", async (req, res) => {
  try {
    const { prompt, language = "English", draftType = "General" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional legal document drafting assistant.
Draft Type: ${draftType}
Language: ${language}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    res.json({
      text: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("Draft error:", err);
    res.status(500).json({ error: "Draft generation failed" });
  }
});

export default router;
