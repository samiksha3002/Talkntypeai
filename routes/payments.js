// routes/payments.js
import express from "express";
import Payment from "../models/Payment.js"; // ✅ make sure this file exists

const router = express.Router();

/**
 * GET /api/payments
 * Fetch all payments for the logged-in user (if auth is enabled),
 * otherwise return all payments.
 */
router.get("/", async (req, res) => {
  try {
    const query = req.user ? { userId: req.user.id } : {};
    const payments = await Payment.find(query).sort({ date: -1 });
    res.json({ payments });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

/**
 * POST /api/payments
 * Add a new payment entry.
 */
router.post("/", async (req, res) => {
  try {
    const { date, client, amount, type, caseId } = req.body;

    // Basic validation
    if (!date || !client || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payment = new Payment({
      date: new Date(date),
      client,
      amount,
      type,
      caseId,
      userId: req.user ? req.user.id : null, // attach user if available
    });

    await payment.save();
    res.status(201).json({ payment });
  } catch (err) {
    console.error("Error adding payment:", err);
    res.status(500).json({ error: "Failed to add payment" });
  }
});

export default router;
