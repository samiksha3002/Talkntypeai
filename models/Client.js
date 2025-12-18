// models/client.js
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

export default Client;
