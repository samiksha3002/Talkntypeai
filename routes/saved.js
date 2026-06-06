// routes/saved.js
// Simple in-memory saved list.
// Replace savedMap with a DB query when you add auth/users.

import express from "express";

const router   = express.Router();
const savedMap = new Map();  // docid → entry object

// GET /api/saved
router.get("/", (req, res) => {
  res.json({ saved: Array.from(savedMap.values()) });
});

// POST /api/saved
// Body: { docid, title, citation, court, date }
router.post("/", (req, res) => {
  const { docid, title, citation, court, date } = req.body;
  if (!docid) return res.status(400).json({ error: "docid is required." });

  const entry = {
    docid   : String(docid),
    title,
    citation,
    court,
    date,
    savedAt : new Date().toISOString(),
  };
  savedMap.set(String(docid), entry);
  res.status(201).json(entry);
});

// DELETE /api/saved/:docid
router.delete("/:docid", (req, res) => {
  const { docid } = req.params;
  if (!savedMap.has(docid)) {
    return res.status(404).json({ error: "Not found in saved list." });
  }
  savedMap.delete(docid);
  res.json({ message: "Removed from saved." });
});

export default router;