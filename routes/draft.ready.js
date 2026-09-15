import express from "express";
import DraftTemplate from "../models/DraftTemplate.js"; 

const router = express.Router();

// Route 1: Fetch ALL drafts (Used by DraftStudio list)
router.get("/all", async (req, res) => {
  try {
    const drafts = await DraftTemplate.find({}).select('_id title category');
    res.status(200).json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route 2: Fetch a SINGLE draft by ID (Used by DraftCreate page)
// THIS IS THE ROUTE THAT WAS MISSING
router.get("/:id", async (req, res) => {
  try {
    const draft = await DraftTemplate.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found in DB" });
    }
    
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;