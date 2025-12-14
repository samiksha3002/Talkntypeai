import express from "express";
import multer from "multer";
import vision from "@google-cloud/vision";

const router = express.Router();
// multer.memoryStorage() is a good practice for file uploads to cloud services
const upload = multer({ storage: multer.memoryStorage() }); 

// Initialize Google Cloud Vision Client
// NOTE: Ensure your environment is authenticated (e.g., via GOOGLE_APPLICATION_CREDENTIALS)
const client = new vision.ImageAnnotatorClient();

// The correct, complete API endpoint is POST /api/ocr/image-to-text
router.post("/image-to-text", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      // Return 400 if the 'image' field is missing in the form data
      return res.status(400).json({ error: "Image not provided" });
    }

    // Use req.file.buffer which contains the image data from memory storage
    const [result] = await client.textDetection(req.file.buffer); 
    const detections = result.textAnnotations;

    res.json({
      // detections[0].description contains the complete detected text block
      text: detections?.[0]?.description || ""
    });

  } catch (error) {
    console.error("OCR Error:", error);
    // Send a 500 status code on server failure (e.g., Vision API key issue or server error)
    res.status(500).json({ error: "Failed to extract text" }); 
  }
});

export default router;