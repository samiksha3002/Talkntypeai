import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'DraftTemplate', required: true },
  title: { type: String, required: true, maxlength: 200 },
  category: { type: String, maxlength: 200 },
  content: { type: String, required: true },
  revision: { type: Number, required: true, default: 1 },
  creationKey: { type: String, required: true },
  creationHash: { type: String, required: true },
  lastOperation: String,
  lastHash: String,
}, { timestamps: true, strict: 'throw' });
schema.index({ ownerId: 1, creationKey: 1 }, { unique: true });
schema.index({ ownerId: 1, updatedAt: -1 });
export default mongoose.models.UserDraft || mongoose.model('UserDraft', schema);
