import express from "express";
import multer from "multer";
import vision from "@google-cloud/vision";

const router = express.Router();

// ✅ Use memory storage for cloud uploads
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Initialize Google Cloud Vision Client
// Make sure GOOGLE_APPLICATION_CREDENTIALS is set in your Render environment
const client = new vision.ImageAnnotatorClient();

router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image not provided" });
    }

    // Run OCR
    const [result] = await client.textDetection(req.file.buffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return res.status(200).json({ success: true, text: "" });
    }

    res.json({
      success: true,
      text: detections[0].description || ""
    });

  } catch (error) {
    console.error("🔥 OCR Error:", error?.message || error);

    // Differentiate common failure types
    if (error.code === 7) {
      // Permission / credentials issue
      return res.status(500).json({ success: false, error: "Google Vision API authentication failed" });
    }

    if (error.code === 14) {
      // Quota / network issue
      return res.status(503).json({ success: false, error: "Google Vision API unavailable" });
    }

    res.status(500).json({ success: false, error: "Failed to extract text" });
  }
});

export default router;
