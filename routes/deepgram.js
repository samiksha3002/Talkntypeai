import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!deepgramApiKey) {
      console.error("❌ Deepgram Key is MISSING in .env file");
      return res.status(500).json({ error: 'Deepgram API Key is missing' });
    }
    res.json({ key: deepgramApiKey });
    
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;