import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/", async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🔵 NEW LEGAL AI REQUEST");
  console.log("ENV:", { NODE_ENV: process.env.NODE_ENV, VERCEL: !!process.env.VERCEL, RENDER: !!process.env.RENDER, DYNO: !!process.env.DYNO });
  console.log("OPENAI_KEY present:", !!process.env.OPENAI_API_KEY, process.env.OPENAI_API_KEY ? `len=${process.env.OPENAI_API_KEY.length}` : '');

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn("Invalid messages payload", messages);
      return res.status(400).json({ error: "Invalid message format" });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY in process.env");
      return res.status(500).json({ error: "Missing OpenAI API Key" });
    }

    // Convert frontend messages → OpenAI format
    const openAIMessages = [
      {
        role: "system",
        content: `
You are TNT AI, a professional legal drafting assistant for Indian advocates.

Rules:
- Draft formal Indian legal documents
- Use sections, clauses, and legal language
- No emojis or casual tone
- Provide complete drafts
        `
      },
      ...messages.map(m => ({
        role: m.role || "user",
        content: m.content
      }))
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ✅ fast + cheap + powerful
      messages: openAIMessages,
      temperature: 0.3
    });

    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error("Unexpected OpenAI response:", completion);
      return res.status(502).json({ error: "Invalid response from OpenAI", raw: completion });
    }

    const aiReply = completion.choices[0].message.content;

    console.log("✅ AI Reply Generated");

    res.json({ reply: aiReply });

  } catch (err) {
    // Enhanced error logging for production debugging
    console.error("🔥 AI Error:", err);
    if (err?.response) {
      console.error("OpenAI response error:", err.response.status, err.response.data);
    }
    // Avoid returning secrets in production
    const details = err?.response?.data || err?.message || String(err);
    res.status(500).json({
      error: "AI Processing Failed",
      details
    });
  }
});

export default router;
