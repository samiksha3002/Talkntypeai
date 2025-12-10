import express from 'express';
import { v2 } from '@google-cloud/translate';
const router = express.Router();

// Initialize Google Translate
// Ensure you have run: npm install @google-cloud/translate
const { Translate } = v2;
const translate = new Translate();

// ROUTE: POST /api/translate/
router.post('/', async (req, res) => {
    const { text, target } = req.body;

    console.log(`Backend received: "${text}" -> Target: ${target}`);

    if (!text || !target) {
        return res.status(400).json({ error: "Text and Target Language are required." });
    }

    try {
        // 1. Call Google API
        const [translation] = await translate.translate(text, target);
        
        console.log("Translation success:", translation);

        // 2. Send back to Frontend
        res.json({ translatedText: translation });

    } catch (error) {
        console.error("Google Translate Error:", error);
        
        // FALLBACK: If API fails (e.g., no credentials), return mocked text so app doesn't freeze
        res.status(500).json({ 
            error: "Translation API Failed", 
            details: error.message,
            // Optional: Send back dummy text for testing if API fails
            // translatedText: `[MOCK] Translated: ${text}` 
        });
    }
});

export default router;