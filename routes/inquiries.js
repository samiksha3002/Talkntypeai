// backend/routes/inquiries.js
import express from "express";
import Inquiry from "../models/Inquiry.js"; // Mongoose model

const router = express.Router();

// POST new inquiry
router.post("/", async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);
    await inquiry.save();
    res.status(201).json({ message: "Inquiry saved successfully", inquiry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all inquiries (no auth filter yet)
router.get("/", async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
