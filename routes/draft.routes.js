import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env
});

router.post("/generate-draft", async (req, res) => {
  try {
    const { prompt, language = "English", draftType = "Legal Petition" } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // SYSTEM PROMPT: Updated for Extra Spacing & Strict Formatting
    const systemInstruction = `
      You are an expert Legal Drafter for Indian Courts.
      
      **GOAL:** Create a spacious, well-formatted legal document ready for printing.
      
      **STRICT VISUAL RULES:**
      1. **NO MARKDOWN:** Do NOT put the output inside \`\`\`html or \`\`\`. Just return the raw code.
      2. **SPACING:**
         - Use **<br><br>** (Double Line Break) between EVERY paragraph to create space.
         - Use **<br><br><br><br>** (4 Line Breaks) before "Signatures" and "Verification" so there is space to sign.
      3. **FORMATTING:**
         - Court Name: <div style="text-align:center; font-weight:bold; font-size:1.2em;"> [COURT NAME] </div>
         - Case No: <div style="text-align:center;"> [CASE DETAILS] </div>
         - Parties: Align Left. Use "Vs." or "AND".
         - Body: Start every point with "<strong>That</strong>". Use <ol> for numbering.
      
      **STRUCTURE TEMPLATE:**
      [COURT NAME CENTERED]
      <br>
      [CASE NO CENTERED]
      <br><br>
      IN THE MATTER OF:
      [Petitioner Details]
      <br>
      VERSUS
      <br>
      [Respondent Details]
      <br><br>
      [TITLE CENTERED & BOLD]
      <br><br>
      MOST RESPECTFULLY SHOWETH:
      <ol>
        <li><strong>MARRIAGE:</strong> That the marriage was solemnized...</li>
        <br>
        <li><strong>STATUS:</strong> That the parties...</li>
        <br>
        <li><strong>JURISDICTION:</strong> That this Hon'ble Court...</li>
      </ol>
      <br><br>
      PRAYER:
      <br>
      It is therefore prayed...
      <br><br><br><br>
      PETITIONER 1 (SIGNATURE)
      <br><br><br><br>
      PETITIONER 2 (SIGNATURE)
      <br><br><br><br>
      ADVOCATE
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemInstruction },
        { 
          role: "user", 
          content: `Draft a legal document for: "${prompt}". Fill all missing details with placeholders like [_____].` 
        },
      ],
    });

    let draftText = completion?.choices?.[0]?.message?.content?.trim() || null;

    if (!draftText) {
      return res.status(500).json({ error: "No response from AI" });
    }

    // --- MAGICAL FIX ---
    // Ye code `html` text aur backticks (```) ko jabardasti hata dega
    draftText = draftText.replace(/```html/g, "").replace(/```/g, "");
    // -------------------

    return res.status(200).json({ text: draftText });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Server Error", details: err.message });
  }
});

export default router;  