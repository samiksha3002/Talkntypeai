import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate-draft", async (req, res) => {
  try {
    const { prompt, language = "English", draftType = "General" } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional legal document drafting assistant.
Draft Type: ${draftType}
Language: ${language}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const draftText =
      completion?.choices?.[0]?.message?.content || "No draft generated.";

    return res.status(200).json({ text: draftText });
  } catch (err) {
    console.error("🔥 Draft generation error:", err);

    return res.status(500).json({
      error: "Draft generation failed",
      details: err.message,
    });
  }
});

export default router;
