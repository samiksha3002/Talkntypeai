import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  // Deterministic owner/document identity also prevents duplicates if autoIndex is disabled.
  _id: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  docid: { type: String, required: true, maxlength: 100 },
  title: { type: String, default: '', maxlength: 2000 },
  citation: { type: String, default: '', maxlength: 1000 },
  court: { type: String, default: '', maxlength: 500 },
  date: { type: String, default: '', maxlength: 100 },
  savedAt: { type: Date, default: Date.now },
}, { versionKey: false });
schema.index({ ownerId: 1, docid: 1 }, { unique: true });
schema.index({ ownerId: 1, savedAt: -1, _id: -1 });
export default mongoose.models.SavedJudgement || mongoose.model('SavedJudgement', schema);
