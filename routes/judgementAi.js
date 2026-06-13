// routes/judgementAi.js
// Uses Gemini REST API directly via axios — no @google/generative-ai package needed

import express from "express";
import axios   from "axios";

const router = express.Router();

// ── Call Gemini REST API directly ─────────────────────────────────────────────
const callGemini = async (prompt) => {
  const key = process.env.Gemini_API_Key || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini_API_Key not set in environment variables.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const { data } = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature     : 0.3,
      maxOutputTokens : 512,
    },
  }, {
    headers : { "Content-Type": "application/json" },
    timeout : 30000,
  });

  // Extract text from Gemini response
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API.");
  return text.trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/headnote
// Body: { title, court, date, snippet, fulltext }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/headnote", async (req, res) => {
  try {
    const { title, court, date, snippet, fulltext } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Case title is required." });
    }

    const caseText = (fulltext || snippet || "")
      .replace(/<[^>]*>/g, "")   // strip HTML
      .slice(0, 4000);

    const prompt = `You are a senior Indian legal expert writing a professional headnote for a law journal.

Case: ${title}
Court: ${court || "Unknown Court"}
Date: ${date || "Unknown Date"}
${caseText ? `\nJudgement Text:\n${caseText}` : ""}

Write a concise headnote in EXACTLY this format (3 bullet points only, no extra text before or after):

• Facts: [1 sentence — who are the parties, what happened, what was the legal dispute]
• Held: [1-2 sentences — what the court decided and the key legal principle/ratio decidendi]
• Significance: [1 sentence — why this case matters, what precedent it sets]

Use formal legal language. Be accurate and concise.`;

    console.log(`[judgement-ai] Generating headnote for: ${title.slice(0, 60)}`);

    const headnote = await callGemini(prompt);

    console.log(`[judgement-ai] ✅ Headnote generated successfully`);
    res.json({ headnote });

  } catch (err) {
    console.error("[judgement-ai/headnote] Error:", err.message);

    if (err.message?.includes("API key") || err.response?.status === 400) {
      return res.status(500).json({ error: "Gemini API key invalid or not set. Check Render environment variables." });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: "AI quota exceeded. Please try again in a moment." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "AI request timed out. Please try again." });
    }

    res.status(500).json({ error: err.message || "Failed to generate headnote." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/simplify
// ─────────────────────────────────────────────────────────────────────────────
router.post("/simplify", async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const prompt = `Simplify this Indian court judgement into plain language for a non-lawyer. Maximum 150 words. Be accurate.

Case: ${title || "Court Judgement"}
Text: ${text.replace(/<[^>]*>/g, "").slice(0, 3000)}

Write the simplified version directly, no preamble.`;

    const simplified = await callGemini(prompt);
    res.json({ simplified });
  } catch (err) {
    console.error("[judgement-ai/simplify]", err.message);
    res.status(500).json({ error: "Failed to simplify text." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/keypoints
// ─────────────────────────────────────────────────────────────────────────────
router.post("/keypoints", async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const prompt = `Extract the 5 most important legal points from this Indian court judgement. Each point = one complete sentence stating a legal rule or finding.

Case: ${title || "Court Judgement"}
Text: ${text.replace(/<[^>]*>/g, "").slice(0, 4000)}

Format as numbered list:
1. [legal point]
2. [legal point]
3. [legal point]
4. [legal point]
5. [legal point]

Only the numbered list, nothing else.`;

    const keypoints = await callGemini(prompt);
    res.json({ keypoints });
  } catch (err) {
    console.error("[judgement-ai/keypoints]", err.message);
    res.status(500).json({ error: "Failed to extract key points." });
  }
});

export default router;