import express from 'express';
import { v2 } from '@google-cloud/translate';
const router = express.Router();

// 🟢 CONFIGURATION: Initialize with API Key
// We use process.env to keep your key safe.
const { Translate } = v2;
const translate = new Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY
});

// ROUTE: POST /api/translate/
router.post('/', async (req, res) => {
    const { text, target } = req.body;

    console.log(`Backend received: "${text}" -> Target: ${target}`);

    if (!text || !target) {
        return res.status(400).json({ error: "Text and Target Language are required." });
    }

    try {
        // Check if Key exists before calling Google
        if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
            throw new Error("GOOGLE_TRANSLATE_API_KEY is missing in .env file");
        }

        // 1. Call Google API
        const [translation] = await translate.translate(text, target);
        
        console.log("✅ Translation success:", translation);

        // 2. Send back to Frontend
        res.json({ translatedText: translation });

    } catch (error) {
        console.error("❌ Google Translate Error:", error.message);
        
        // 🟢 SMART FALLBACK: 
        // Instead of breaking the app with a 500 Error, we return a mock response.
        // This proves your Frontend <-> Backend connection is working.
        
        const mockText = target === 'hi' ? 
            `[Mock Hindi] ${text} (API Key Invalid)` : 
            `[Mock] ${text}`;

        res.json({ 
            translatedText: mockText,
            isMock: true, 
            warning: "Real translation failed. Check backend console for API Key errors." 
        });
    }
});

export default router;