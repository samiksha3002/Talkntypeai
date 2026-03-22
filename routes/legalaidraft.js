import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

router.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        console.log("🔍 Search query received:", query);

        // Check if API Key exists
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY is missing in .env");
            return res.status(500).json({ error: "API Key not configured on server" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are 'TNT Legal AI'. Answer this: "${query}".
            Provide response strictly in JSON:
            {
              "answer": "Detailed answer...",
              "citations": ["Case 1", "Case 2"]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Sanitize the response text
        const jsonMatch = text.match(/\{[\s\S]*\}/); // Sirf JSON wala part nikalne ke liye
        if (!jsonMatch) {
            throw new Error("AI did not return valid JSON");
        }
        
        const cleanJson = JSON.parse(jsonMatch[0]);
        res.json(cleanJson);

    } catch (error) {
        console.error("🔥 AI SEARCH ERROR:", error.message);
        res.status(500).json({ error: error.message || "Legal AI failed to process" });
    }
});

export default router;