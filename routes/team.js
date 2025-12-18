// backend/routes/team.js
import express from "express";
import TeamMember from "../models/TeamMember.js";
// import { authMiddleware } from "../middleware/auth.js"; // if you want user-specific

const router = express.Router();

// POST: Add new team member
router.post("/", async (req, res) => {
  try {
    const member = new TeamMember({
      ...req.body,
      userId: req.user?.id || null // attach logged-in user if authMiddleware is used
    });
    await member.save();
    res.status(201).json({ message: "Team member added successfully", member });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: List team members for user
router.get("/", async (req, res) => {
  try {
    const members = await TeamMember.find({ userId: req.user?.id });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
