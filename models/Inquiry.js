// backend/models/Inquiry.js
import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema({
  inquirerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: String,
  typeOfCase: String,
  summary: String,
  followUpDate: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Inquiry", inquirySchema);
