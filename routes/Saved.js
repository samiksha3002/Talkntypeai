// routes/saved.js
//
// Simple in-memory saved list (replace with DB like SQLite/Postgres in prod).
// In production: add user auth middleware and persist to database.
//

import express from "express";

const router  = express.Router();

// In-memory store (keyed by docid)
const savedMap = new Map();

// GET /api/saved — list all saved judgements
router.get("/", (req, res) => {
  res.json({ saved: Array.from(savedMap.values()) });
});

// POST /api/saved — save a judgement
//   Body: { docid, title, citation, court, date }
router.post("/", (req, res) => {
  const { docid, title, citation, court, date } = req.body;
  if (!docid) return res.status(400).json({ error: "docid is required." });

  const entry = {
    docid:   String(docid),
    title,
    citation,
    court,
    date,
    savedAt: new Date().toISOString(),
  };
  savedMap.set(String(docid), entry);
  res.status(201).json(entry);
});

// DELETE /api/saved/:docid — remove a saved judgement
router.delete("/:docid", (req, res) => {
  const { docid } = req.params;
  if (!savedMap.has(docid)) {
    return res.status(404).json({ error: "Not found in saved list." });
  }
  savedMap.delete(docid);
  res.json({ message: "Removed from saved." });
});

export default router;