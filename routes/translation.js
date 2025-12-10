// routes/translation.js

import express from 'express';
// 1. CRITICAL FIX: Direct import for the V2 client in ES Module environment
import { Translate } from '@google-cloud/translate/build/src/v2/index.js'; 

// We no longer need fs or path since we are letting the client library handle the file
// import fs from 'fs'; 
// import path from 'path';

const router = express.Router(); 

// --- CLIENT INITIALIZATION (Simplified and Standardized) ---
let translate;

try {
    // 2. SIMPLIFICATION: The client automatically finds the credentials 
    // from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    translate = new Translate(); 
    console.log("Google Translate client initialized using environment credentials.");

} catch (e) {
    // This catch block will trigger if the client fails to instantiate for any reason
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
        // Send a specific error back if the client failed to initialize
        return res.status(500).json({ error: 'Translation client not initialized due to server configuration error. Check backend logs for credential issues.' });
    }

    try {
        // The V2 API returns an array, with the translation text in the first element.
        let [translation] = await translate.translate(text, target);
        
        // Ensure we handle the translation result correctly
        translation = Array.isArray(translation) ? translation[0] : translation;

        res.json({ translatedText: translation });
        
    } catch (error) {
        // Catch network or API-specific errors (e.g., 403 Permission Denied)
        console.error('ERROR during translation API call:', error.message);
        res.status(500).json({ error: `Translation service failed. Details: ${error.message}` });
    }
});

export default router;