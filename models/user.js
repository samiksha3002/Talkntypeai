import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, "Username is required"], 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    select: false // Keeps password hidden for security
  },
  role: {
    type: String,
    enum: ['admin', 'advocate'],
    default: 'advocate'
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['trial', 'yearly', 'lifetime'], 
      default: 'yearly' 
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

// This line prevents "Model already exists" errors in Next.js
export default mongoose.models.User || mongoose.model('User', UserSchema);