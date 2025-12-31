import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/generate-draft", async (req, res) => {
  try {
    const { prompt, language = "English", draftType = "General" } = req.body;

    // Validate prompt
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Call OpenAI Chat Completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Ya gpt-3.5-turbo agar budget kam rakhna hai
      messages: [
        {
          role: "system",
          // 👇 YAHAN CHANGE KIYA HAI 👇
          // Humne AI ko instruct kiya hai ki HTML tags use kare (Markdown nahi)
          content: `You are a professional legal document drafting assistant.
          Draft Type: ${draftType}
          Language: ${language}
          
          CRITICAL INSTRUCTION: 
          - Provide the output in clean **HTML format** only.
          - Use <h3> for headings, <p> for paragraphs, <ul>/<li> for lists, and <strong> for bold text.
          - Do NOT use Markdown (like **text** or # Header).
          - Use <br> for line breaks where necessary.
          - Do not include \`\`\`html code blocks, just return the raw HTML string.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract draft text safely
    const draftText = completion?.choices?.[0]?.message?.content?.trim() || null;

    if (!draftText) {
      return res.status(500).json({
        error: "Draft generation failed",
        details: "Empty response from AI model",
      });
    }

    // Success response
    // Frontend par ye data.text ke roop mein milega
    return res.status(200).json({ text: draftText });
    
  } catch (err) {
    console.error("🔥 Draft generation error:", err);

    return res.status(500).json({
      error: "Draft generation failed",
      details: err?.message || "Unknown error",
    });
  }
});

export default router;