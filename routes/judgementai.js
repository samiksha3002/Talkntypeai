// routes/judgementAi.js
// Dedicated AI route for LexArchive judgement features:
//   POST /api/judgement-ai/headnote   — AI headnote/summary
//   POST /api/judgement-ai/compare    — compare two cases (future)
//   POST /api/judgement-ai/simplify   — simplify legal language (future)

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// ── Gemini client ─────────────────────────────────────────────────────────────
const getGemini = () => {
  const key = process.env.Gemini_API_Key || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key not set in environment.");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // fast + cheap
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/headnote
// Body: { title, court, date, snippet, fulltext }
// Returns: { headnote: "• Facts: ...\n• Held: ...\n• Significance: ..." }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/headnote", async (req, res) => {
  try {
    const { title, court, date, snippet, fulltext } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Case title is required." });
    }

    // Use fulltext if available, else snippet, else just title+court
    const caseText = (fulltext || snippet || '')
      .replace(/<[^>]*>/g, '')   // strip HTML tags
      .slice(0, 4000);           // Gemini context limit safety

    const prompt = `You are a senior Indian legal expert writing a professional headnote for a law journal.

Case: ${title}
Court: ${court || 'Unknown Court'}
Date: ${date || 'Unknown Date'}
${caseText ? `\nJudgement Text:\n${caseText}` : ''}

Write a concise headnote in EXACTLY this format (3 bullet points, no extra text):

• Facts: [1 sentence — who are the parties, what happened, what was the legal dispute]
• Held: [1-2 sentences — what the court decided and the key legal principle/ratio]
• Significance: [1 sentence — why this case matters, what precedent it sets]

Use formal legal language. Be accurate. Do not add any other text before or after.`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    const headnote = result.response.text().trim();

    console.log(`[judgement-ai] headnote generated for: ${title.slice(0, 50)}`);
    res.json({ headnote });

  } catch (err) {
    console.error("[judgement-ai/headnote] Error:", err.message);

    // Specific error messages
    if (err.message?.includes("API key")) {
      return res.status(500).json({ error: "Gemini API key not configured." });
    }
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      return res.status(429).json({ error: "AI quota exceeded. Please try again in a moment." });
    }

    res.status(500).json({ error: "Failed to generate headnote. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/simplify
// Simplifies complex legal text into plain language
// Body: { text, title }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/simplify", async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const prompt = `Simplify this Indian court judgement text into plain, easy-to-understand language for a non-lawyer. 
Keep it accurate but use simple words. Maximum 200 words.

Case: ${title || 'Court Judgement'}
Text: ${text.replace(/<[^>]*>/g, '').slice(0, 3000)}

Write the simplified version directly, no preamble.`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    res.json({ simplified: result.response.text().trim() });

  } catch (err) {
    console.error("[judgement-ai/simplify] Error:", err.message);
    res.status(500).json({ error: "Failed to simplify text." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/keypoints
// Extracts key legal points from a judgement
// Body: { text, title }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/keypoints", async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const prompt = `Extract the 5 most important legal points from this Indian court judgement.
Each point should be a complete sentence explaining a legal rule, principle, or finding.

Case: ${title || 'Court Judgement'}
Text: ${text.replace(/<[^>]*>/g, '').slice(0, 4000)}

Format as numbered list:
1. [legal point]
2. [legal point]
...

Only the numbered list, no other text.`;

    const model = getGemini();
    const result = await model.generateContent(prompt);
    res.json({ keypoints: result.response.text().trim() });

  } catch (err) {
    console.error("[judgement-ai/keypoints] Error:", err.message);
    res.status(500).json({ error: "Failed to extract key points." });
  }
});

export default router;