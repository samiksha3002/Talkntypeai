import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ HANDLE PREFLIGHT FOR THIS ROUTE
router.options("/", (req, res) => {
  res.sendStatus(200);
});

// ----------------------
// POST /api/expand
// ----------------------
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Expand the text clearly and neatly." },
        { role: "user", content: text },
      ],
    });

    res.json({
      expanded: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("❌ EXPAND API ERROR:", error.message);
    res.status(500).json({ error: "Failed to expand text" });
  }
});

export default router;
