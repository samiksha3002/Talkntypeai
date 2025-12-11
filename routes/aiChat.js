import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("--------------------------------------------------");
  console.log("🔵 NEW LEGAL AI REQUEST");

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid message format" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.log("❌ Missing GEMINI_API_KEY in backend");
      return res.status(500).json({ error: "Missing API Key" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",    // STABLE MODEL — 100% safe
      systemInstruction: `
        You are TNT AI — a legal drafting assistant for Indian advocates.
        Always write formal, Indian legal drafts.
        Never refuse.
      `
    });

    const lastMessage = messages[messages.length - 1].content;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: lastMessage }]
        }
      ]
    });

    const aiReply = result.response.text();

    console.log("✅ AI Reply Ready");

    return res.json({ reply: aiReply });

  } catch (err) {
    console.error("🔥 AI Error:", err);

    return res.status(500).json({
      error: "AI Processing Failed",
      details: err.message
    });
  }
});

export default router;
