// models/Case.js
import mongoose from 'mongoose';

const CaseSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Links to the User model
    required: true 
  },
  caseName: { type: String, required: true },
  caseNumber: { type: String },
  courtName: { type: String, required: true },
  hearingDate: { type: Date, required: true },
  description: { type: String },
  status: { type: String, default: 'Open' }, // Open, Closed, Pending
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite error in dev/hot-reload
const Case = mongoose.models.Case || mongoose.model('Case', CaseSchema);

export default Case;
