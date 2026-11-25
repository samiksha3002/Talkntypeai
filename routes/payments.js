// routes/payments.js — the signed-in advocate's income/expense ledger.
import express from "express";
import Payment from "../models/Payment.js";
import { ownerOf, pick, sendError, createRecord } from "../utils/ownership.js";
import { requireDraftAuth, matchingOwner } from "../middleware/tenantScope.js";

// All entries are scoped to the signed-in user (req.user from the verified JWT).
export function createPaymentsRouter({ payments = Payment, auth = requireDraftAuth } = {}) {
  const router = express.Router();
  router.use(auth, matchingOwner);   // a userId in query/body must match the session (403)

  // GET /api/payments — only the signed-in user's entries
  router.get("/", async (req, res) => {
    try {
      const rows = await payments.find({ userId: ownerOf(req) }).sort({ date: -1 });
      res.json({ payments: rows });
    } catch (error) { sendError(res, error, "Failed to fetch payments"); }
  });

  // POST /api/payments
  router.post("/", async (req, res) => {
    try {
      const { date, client, amount, type, caseId } = pick(req.body, ["date", "client", "amount", "type", "caseId"], { max: 500 });
      const value = Number(amount);
      if (!date || !client || !Number.isFinite(value) || value <= 0 || !["Income", "Expense"].includes(type)) {
        return res.status(400).json({ error: "Missing or invalid fields" });
      }
      const payment = await createRecord(payments, { date: new Date(date), client, amount: value, type, caseId, userId: ownerOf(req) });
      res.status(201).json({ payment });
    } catch (error) { sendError(res, error, "Failed to add payment"); }
  });

  return router;
}

export default createPaymentsRouter();
