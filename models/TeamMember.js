// backend/models/TeamMember.js
import mongoose from "mongoose";
const teamMemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  role: { type: String, enum: ["Staff", "Associate", "Admin"], default: "Staff" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("TeamMember", teamMemberSchema);
