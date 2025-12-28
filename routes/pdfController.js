// routes/pdfController.js
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");  // CommonJS import

export const extractTextFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (err) {
    console.error("PDF processing error:", err);
    res.status(500).json({ error: err.message });
  }
};
