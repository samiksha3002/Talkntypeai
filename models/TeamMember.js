// backend/models/TeamMember.js
import mongoose from "mongoose";
const teamMemberSchema = new mongoose.Schema({
  // Owner (the advocate whose team this is). See scripts/assign-orphan-records.mjs.
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  role: { type: String, enum: ["Staff", "Associate", "Admin"], default: "Staff" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("TeamMember", teamMemberSchema);
