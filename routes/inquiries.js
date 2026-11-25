// backend/routes/inquiries.js
import express from "express";
import Inquiry from "../models/Inquiry.js";
import { ownerOf, pick, validObjectId, sendError } from "../utils/ownership.js";

const INQUIRY_FIELDS = ["inquirerName", "contactNumber", "email", "typeOfCase", "summary", "followUpDate"];

// Inquiries belong to the signed-in user (req.user from the verified JWT).
export function createInquiriesRouter({ inquiries = Inquiry } = {}) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const inquiry = await inquiries.create({ ...pick(req.body, INQUIRY_FIELDS), userId: ownerOf(req) });
      res.status(201).json({ success: true, message: "Inquiry saved successfully", inquiry });
    } catch (error) { sendError(res, error); }
  });

  router.get("/", async (req, res) => {
    try {
      const rows = await inquiries.find({ userId: ownerOf(req) }).sort({ createdAt: -1 });
      res.status(200).json(rows);
    } catch (error) { sendError(res, error); }
  });

  router.get("/:id", async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid inquiry ID" });
    try {
      const inquiry = await inquiries.findOne({ _id: req.params.id, userId: ownerOf(req) });
      if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });
      res.status(200).json(inquiry);
    } catch (error) { sendError(res, error); }
  });

  router.put("/:id", async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid inquiry ID" });
    try {
      const updated = await inquiries.findOneAndUpdate({ _id: req.params.id, userId: ownerOf(req) },
        { $set: pick(req.body, INQUIRY_FIELDS) }, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ success: false, message: "Inquiry not found" });
      res.status(200).json({ success: true, message: "Inquiry updated successfully", inquiry: updated });
    } catch (error) { sendError(res, error); }
  });

  router.delete("/:id", async (req, res) => {
    if (!validObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid inquiry ID" });
    try {
      const deleted = await inquiries.findOneAndDelete({ _id: req.params.id, userId: ownerOf(req) });
      if (!deleted) return res.status(404).json({ success: false, message: "Inquiry not found" });
      res.status(200).json({ success: true, message: "Inquiry deleted successfully" });
    } catch (error) { sendError(res, error); }
  });

  return router;
}

export default createInquiriesRouter();
