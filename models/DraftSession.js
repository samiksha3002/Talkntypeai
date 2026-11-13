import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
export default mongoose.models.DraftSession || mongoose.model('DraftSession', schema);
