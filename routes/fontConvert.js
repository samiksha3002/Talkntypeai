import express from "express";
import kru2uni from "@anthro-ai/krutidev-unicode";

const router = express.Router();

// KrutiDev → Unicode API
router.post("/krutidev-to-unicode", (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  const unicodeText = kru2uni(text); // Convert KrutiDev → Unicode
  res.json({ convertedText: unicodeText });
});

export default router;
