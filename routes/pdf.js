import express from "express";
import multer from "multer";
import fs from "fs"; // File delete karne ke liye
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = express.Router();

// Disk storage use karein taaki RAM crash na ho
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "/tmp"); // Render par temporary storage ke liye '/tmp' use hota hai
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB Limit
});

router.post("/upload-pdf", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;

  try {
    // File ko read karein
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    res.json({
      success: true,
      totalPages: data.numpages,
      text: data.text,
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Badi file process karne mein server fail ho gaya." });
  } finally {
    // ✅ Kaam hone ke baad file delete zaroor karein
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

export default router;  