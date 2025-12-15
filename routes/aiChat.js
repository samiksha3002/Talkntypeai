import express from "express";
import OpenAI from "openai";

const router = express.Router();

// ✅ Initialize OpenAI safely
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 🔹 GET /api/chat
 * Just for health-check / debug
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "TNT AI Chat API is running. Use POST to chat.",
  });
});

/**
 * 🔹 POST /api/chat
 * Main AI chat endpoint
 */
router.post("/", async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🔵 NEW LEGAL AI REQUEST");

  try {
    const { messages } = req.body;

    // ✅ Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Invalid message format. 'messages' array required.",
      });
    }

    // ✅ Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OpenAI API Key",
      });
    }

    // ✅ Convert frontend messages → OpenAI format
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
        `,
      },
      ...messages.map((m) => ({
        role: m.role || "user",
        content: m.content,
      })),
    ];

    // ✅ OpenAI request
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      temperature: 0.3,
    });

    const aiReply =
      completion?.choices?.[0]?.message?.content ||
      "No response generated.";

    console.log("✅ AI Reply Generated");

    // ✅ Final response
    res.status(200).json({
      reply: aiReply,
    });
  } catch (err) {
    console.error("🔥 AI Error:", err);

    res.status(500).json({
      error: "AI Processing Failed",
      details: err.message,
    });
  }
});

export default router;
