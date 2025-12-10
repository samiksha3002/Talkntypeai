import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load the .env file
dotenv.config();

const router = express.Router();

// Initialize Gemini with your specific key name
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    // Log to confirm the server is working and has the Key
    console.log("🔹 AI Request Received.");
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file!");
        return res.status(500).json({ content: "Server Error: API Key missing." });
    }

    const lastUserMessage = messages[messages.length - 1].content;

    // Use Gemini 1.5 Flash (It's fast and free-tier friendly)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "You are 'TNT AI', a legal assistant for Indian Advocates. Strictly cite Indian Laws (IPC, CrPC, BNS) and draft purely for Section 138 NI Act cases."
    });

    const result = await model.generateContent(lastUserMessage);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Generated:", text.substring(0, 30) + "...");

    res.json({ content: text });

  } catch (error) {
    console.error("❌ Backend Error:", error);
    res.status(500).json({ content: "Error: Could not connect to Google Gemini." });
  }
});

export default router;