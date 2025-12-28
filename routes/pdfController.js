// routes/pdfController.js
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // <-- load CommonJS module correctly

export const extractTextFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer); // <-- now pdfParse is a function

    fs.unlinkSync(req.file.path);
    res.json({ text: data.text });
  } catch (err) {
    console.error("PDF processing error:", err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
};
