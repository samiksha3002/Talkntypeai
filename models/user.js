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
  password: { 
    type: String, 
    required: [true, "Password is required"] 
    // Note: We removed 'select: false' for now so your plain-text login logic works easily. 
    // Once we add hashing later, we can add it back.
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