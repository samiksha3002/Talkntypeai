import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/fix-grammar
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Fix grammar and improve clarity. Do NOT change meaning.",
        },
        { role: "user", content: text },
      ],
    });

    res.json({
      fixed: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("FIX GRAMMAR ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
