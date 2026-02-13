import express from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

const router = express.Router();
// Upload setup
const upload = multer({ dest: "uploads/" });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image uploaded" });
    }

    // Read uploaded file and convert to base64
    const fileData = fs.readFileSync(req.file.path);
    const base64 = fileData.toString("base64");
    
    // MIME type detection (Optional basic check, or default to png/jpeg)
    const mimeType = req.file.mimetype || "image/png";

    // Correct OpenAI format for OCR with Layout Preservation
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",   // Note: 'gpt-4o' handles complex tables better than 'mini'
      messages: [
        {
          role: "user",
          content: [
           // ocr.route.js (Backend)

// ... inside messages array
{ 
  type: "text", 
  text: `
    Extract text from this image exactly as it appears.
    
    STRICT RULES:
    1. **Do NOT start with** phrases like "Here is the extracted text" or "Based on the image". Just give the text directly.
    2. **Preserve Structure:** Keep new lines, lists, and gaps exactly as seen in the image.
    3. **Layout:** If there is a large gap between words (like a form), keep that gap.
    4. **Tables:** If there is a table, format it using Markdown pipe tables (| Col1 | Col2 |).
    
    Output ONLY the raw content.
  ` 
},

            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ]
    });

    // Safely extract text
    const text = response.choices[0]?.message?.content || "";

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, text });
  } catch (err) {
    console.error("OCR Error:", err);
    // Cleanup file if error occurs before unlink
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;