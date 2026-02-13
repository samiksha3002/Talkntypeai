import mongoose from "mongoose";

const CsvCaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  serialNo: { type: String },      // CSV Header: Id
  lastDate: { type: String },      // CSV Header: LastDate
  courtName: { type: String },     // CSV Header: Court
  caseNumber: { type: String },    // CSV Header: MatterNo
  petitioner: { type: String },    // CSV Header: First Party
  respondent: { type: String },    // CSV Header: Second Party
  nextDate: { type: String },      // CSV Header: Next Date
  status: { type: String, default: "Active" }
}, { timestamps: true });

export default mongoose.model("CsvCaseModel", CsvCaseSchema);