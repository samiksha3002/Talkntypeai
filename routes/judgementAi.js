// routes/judgementAi.js
// Same Gemini pattern as your existing pdf.js route

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// ── Same as your pdf.js ───────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      .replace(/<[^>]*>/g, "")  // strip HTML tags
      .slice(0, 4000);

    const prompt = `You are a senior Indian legal expert writing a professional headnote for a law journal.

Case: ${title}
Court: ${court || "Unknown Court"}
Date: ${date || "Unknown Date"}
${caseText ? `\nJudgement Text:\n${caseText}` : ""}

Write a concise headnote in EXACTLY this format (3 bullet points only, no extra text):

• Facts: [1 sentence — parties, dispute, what happened]
• Held: [1-2 sentences — court's decision and key legal principle]
• Significance: [1 sentence — why this case matters as precedent]

Use formal legal language. Be accurate and concise.`;

    console.log(`[judgement-ai] Generating headnote for: ${title.slice(0, 60)}`);

   const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent(prompt);
    const headnote = result.response.text().trim();

    console.log(`[judgement-ai] ✅ Headnote generated`);
    res.json({ headnote });

  } catch (err) {
    console.error("[judgement-ai/headnote] Error:", err.message);
    if (err.message?.includes("quota") || err.status === 429) {
      return res.status(429).json({ error: "AI quota exceeded. Try again shortly." });
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

    const prompt = `Simplify this Indian court judgement into plain language for a non-lawyer. Maximum 150 words.

Case: ${title || "Court Judgement"}
Text: ${text.replace(/<[^>]*>/g, "").slice(0, 3000)}

Write simplified version directly, no preamble.`;

    const model    = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result   = await model.generateContent(prompt);
    res.json({ simplified: result.response.text().trim() });

  } catch (err) {
    console.error("[judgement-ai/simplify]", err.message);
    res.status(500).json({ error: "Failed to simplify." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/judgement-ai/keypoints
// ─────────────────────────────────────────────────────────────────────────────
router.post("/keypoints", async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required." });

    const prompt = `Extract 5 key legal points from this Indian court judgement. One sentence each.

Case: ${title || "Court Judgement"}
Text: ${text.replace(/<[^>]*>/g, "").slice(0, 4000)}

Format:
1. [point]
2. [point]
3. [point]
4. [point]
5. [point]

Only the list, nothing else.`;

    const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    res.json({ keypoints: result.response.text().trim() });

  } catch (err) {
    console.error("[judgement-ai/keypoints]", err.message);
    res.status(500).json({ error: "Failed to extract key points." });
  }
});

export default router;