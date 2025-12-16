// ----------------------
// IMPORTS
// ----------------------
import express from "express";
import cors from "cors";
import OpenAI from "openai";

// ----------------------
// INIT
// ----------------------
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ----------------------
// ✅ CORS CONFIG
// ----------------------
const allowedOrigins = [
  "https://www.talkntype.com",
  "https://talkntype.com",
  "http://localhost:3000",
  "http://localhost:5173"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
};

// Apply CORS to this router
router.use(cors(corsOptions));

// ----------------------
// GET /api/chat → for browser test
// ----------------------
router.get("/", (req, res) => {
  res.send("✅ Chat API is live. Use POST to send messages.");
});

// ----------------------
// OPTIONS /api/chat → preflight
// ----------------------
router.options("/", cors(corsOptions));

// ----------------------
// POST /api/chat → actual AI chat
// ----------------------
router.post("/", async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🔵 NEW LEGAL AI REQUEST");
  console.log("ENV:", {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    RENDER: !!process.env.RENDER,
    DYNO: !!process.env.DYNO
  });
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      temperature: 0.3
    });

    if (!completion?.choices?.[0]?.message?.content) {
      console.error("Unexpected OpenAI response:", completion);
      return res.status(502).json({ error: "Invalid response from OpenAI", raw: completion });
    }

    const aiReply = completion.choices[0].message.content;
    console.log("✅ AI Reply Generated");

    res.json({ reply: aiReply });

  } catch (err) {
    console.error("🔥 AI Error:", err);
    if (err?.response) {
      console.error("OpenAI response error:", err.response.status, err.response.data);
    }
    const details = err?.response?.data || err?.message || String(err);
    res.status(500).json({
      error: "AI Processing Failed",
      details
    });
  }
});

export default router;
