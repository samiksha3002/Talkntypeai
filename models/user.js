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
    required: function () { return !this.passwordHash; }
    // Legacy records remain readable; new registrations store passwordHash only.
  },
  
  passwordHash: { type: String, validate: value => value === undefined || /^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/.test(value) },

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