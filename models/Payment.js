import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  client: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["Income", "Expense"], required: true },
  caseId: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Payment", paymentSchema);
