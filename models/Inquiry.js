// backend/models/Inquiry.js
import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  // Owner (the advocate). Records created before ownership existed have no userId and
  // are visible to nobody until assigned (scripts/assign-orphan-records.mjs).
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  inquirerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: String,
  typeOfCase: String,
  summary: String,
  followUpDate: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Inquiry", inquirySchema);
