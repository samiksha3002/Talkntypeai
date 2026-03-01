import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// --- Generate Legal Draft ---
router.post("/generate-legal-draft", async (req, res) => {
  try {
    const { facts, language, documentType } = req.body;
    let pdfContentPart = null;

    // Use Gemini to read the PDF directly instead of using pdfParse
    if (req.files && req.files.referenceFile) {
      pdfContentPart = {
        inline_data: {
          mime_type: "application/pdf",
          data: req.files.referenceFile.data.toString("base64"),
        },
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: "API Key missing" });
    }

    const finalPrompt = `You are a Senior Indian Advocate.
    Draft a formal ${documentType || "legal document"} in ${language || "English"}.
    Facts: ${facts}.
    Instructions: Use professional legal terminology like 'In the Court of', 'Most Respectfully Showeth'. If a PDF is provided, use its context for the facts.`;

    // Construct the contents array for Gemini
    const contents = [
      {
        role: "user",
        parts: [
          { text: finalPrompt },
          ...(pdfContentPart ? [pdfContentPart] : []), // Add the PDF part only if it exists
        ],
      },
    ];

    // Note: Using 'gemini-1.5-flash' as it is highly reliable for PDF processing
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    let generatedDraft = "AI returned no text";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      generatedDraft = data.candidates[0].content.parts[0].text;
    }

    res.json({ success: true, draft: generatedDraft });
  } catch (error) {
    console.error("Critical AI Error:", error.message);
    res.status(500).json({ success: false, error: "AI Error: " + error.message });
  }
});

// --- List Available Models ---
router.get("/list-models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    res.json({ success: true, models: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;