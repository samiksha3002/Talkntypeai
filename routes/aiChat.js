// routes/aiChat.js
import express from "express";
import { GoogleAI } from "@google/generative-ai";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("-------------------------------------------------");
  console.log("🔵 NEW AI CHAT REQUEST RECEIVED");

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid message format." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("❌ Gemini API Key Missing!");
      return res.status(500).json({ error: "Backend missing Gemini API Key" });
    }

    const genAI = new GoogleAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `
        You are TNT AI — a legal drafting assistant for Indian Advocates.
        Create polished, formal, court-ready drafts.
        Use Indian Legal Terminology. Never refuse.
      `,
    });

    const lastMessage = messages[messages.length - 1].content;

    console.log("📝 User Input:", lastMessage);

    // Gemini API PROPER request format
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: lastMessage }],
        },
      ],
    });

    const aiReply = result.response.text();

    console.log("✅ AI Reply Generated!");

    return res.json({
      reply: aiReply || "No response generated.",
    });

  } catch (error) {
    console.error("🔥 AI Processing Error:", error);

    return res.status(500).json({
      error: "AI Service Error",
      details: error?.message || "Unknown Error",
    });
  }
});
export default router;
