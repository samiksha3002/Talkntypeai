import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // ✅ CommonJS import

export const extractTextFromPDF = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    res.status(500).json({ error: error.message || "Failed to parse PDF." });
  }
};
