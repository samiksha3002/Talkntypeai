import 'dotenv/config'; // 1. IMPORTANT: Loads .env variables
import express from 'express';
// Using your specific import path regarding V2 client
import { Translate } from '@google-cloud/translate/build/src/v2/index.js'; 

const router = express.Router(); 

// --- CLIENT INITIALIZATION (SECURE MODE) ---
let translate;

try {
    // Check if critical variables exist before initializing
    if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("Missing GOOGLE_PROJECT_ID or GOOGLE_PRIVATE_KEY in .env file");
    }

    // 2. Initialize using Environment Variables (No JSON file needed)
    translate = new Translate({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            // 3. FIX: Replace escaped newlines so the key works correctly
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }
    });

    console.log("Google Translate client initialized successfully using .env credentials.");

} catch (e) {
    console.error("CRITICAL ERROR: Failed to instantiate Google Translate client.", e.message);
    translate = null; 
}
// -----------------------------

router.post('/', async (req, res) => {
    const { text, target } = req.body;

    if (!text || !target) {
        return res.status(400).json({ error: 'Missing text or target language.' });
    }
    
    // Check if initialization failed
    if (!translate) {
        return res.status(500).json({ error: 'Translation client not initialized due to server configuration error. Check .env variables.' });
    }

    try {
        // The V2 API returns an array, with the translation text in the first element.
        let [translation] = await translate.translate(text, target);
        
        // Ensure we handle the translation result correctly
        translation = Array.isArray(translation) ? translation[0] : translation;

        res.json({ translatedText: translation });
        
    } catch (error) {
        console.error('ERROR during translation API call:', error.message);
        res.status(500).json({ error: `Translation service failed. Details: ${error.message}` });
    }
});

export default router;