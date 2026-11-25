import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // 1. Personal Details (Matches your Register Page)
  fullName: { 
    type: String, 
    required: [true, "Full Name is required"],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    trim: true,
    lowercase: true 
  },
  phone: { type: String, trim: true },
  state: { type: String },
  city: { type: String },
  executive: { type: String }, 
  
  // 2. Security
  // bcrypt hash (cost 12). Never selected unless explicitly requested with '+password'.
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
  },
  
  // 3. Roles & Permissions
  role: { 
    type: String, 
    enum: ['user', 'admin'], // Matches the checks in your server.js
    default: 'user' 
  },
  
  // 4. Subscription Logic
  subscription: {
    plan: { type: String, default: 'demo' }, 
    startDate: { type: Date },
    expiryDate: { type: Date }, 
    isActive: { type: Boolean, default: false } 
  }
}, { timestamps: true });


// Prevent "Model Overwrite" errors in development
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;