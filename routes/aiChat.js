// routes/aiChat.js
import express from "express";
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("-----------------------------------------");
  console.log("🔵 NEW CHAT REQUEST RECEIVED");

  try {
    const { messages } = req.body;
    
    // 1. Load the Key INSIDE the request to ensure dotenv has finished loading
    const apiKey = process.env.GEMINI_API_KEY;

    if (!messages || !Array.isArray(messages) || !apiKey) {
      console.error("❌ CRITICAL ERROR: Invalid request or API Key is missing.");
      console.error("Debug Info -> Key exists:", !!apiKey); 
      return res.status(400).json({ error: "Invalid request format or missing API Key" });
    }

    // 2. Initialize the client HERE (Lazy Initialization)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 3. Use the current stable model for late 2025
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      systemInstruction: `You are 'TNT AI', a specialized legal drafting assistant for Indian Advocates. 
Your goal is to assist lawyers by generating professional legal drafts, court applications, affidavits, and case summaries based on their inputs.
DO NOT refuse to draft documents. 
Assume the user is a qualified advocate who will review your output. 
Use formal Indian legal terminology (e.g., 'Hon'ble Court', 'Petitioner', 'Respondent').`
    });

    const userQuery = messages[messages.length - 1].content;
    console.log("🔹 User Asked:", userQuery);
    console.log("⏳ Contacting Google Gemini (Model: 2.5-flash)...");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userQuery }]
        }
      ]
    });

    const aiReply = result.response.text() || "(No reply generated.)";
    console.log("✅ Google Responded!");

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("🔥 Gemini Error:", error.message);
    
    if (error.message.includes("404")) {
       console.error("👉 Check if 'gemini-2.5-flash' is enabled in your Google Cloud project.");
    }

    res.status(500).json({
      error: "Gemini Processing Error",
      details: error.message
    });
  }
  console.log("-----------------------------------------");
});

export default router;