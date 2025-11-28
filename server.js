import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORRECT CORS CONFIGURATION ---
// 1. Define allowed origins
const allowedOrigins = [
  "https://www.talkntype.com",
  "https://talkntype.com",
  "http://localhost:5173",
  "http://localhost:5174"
];

// 2. Configure CORS Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Added OPTIONS here
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// 3. Handle Preflight Requests (Crucial for Render/Vercel communication)
app.options('*', cors());

// Middleware to parse JSON
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talkntype')
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));


// --- USER MODEL ---
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  state: String,
  city: String,
  phone: String,
  executive: String, 
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, 
  subscription: {
    plan: { type: String, default: 'demo' }, 
    startDate: { type: Date },
    expiryDate: { type: Date }, 
    isActive: { type: Boolean, default: false } 
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);


// --- 1. REGISTER ROUTE (Force Inactive) ---
app.post('/api/create-user', async (req, res) => {
  try {
    const { fullName, email, state, city, phone, executive, password } = req.body;

    if (email === 'admin@talkntype.com') {
      return res.status(400).json({ message: 'This email is reserved for Admin. Use Login page.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      fullName,
      email,
      state,
      city,
      phone,
      executive,
      password: hashedPassword,
      role: 'user',
      subscription: {
        isActive: false,
        plan: 'demo',
        startDate: null,
        expiryDate: null
      }
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Registration successful! Wait for admin approval.' });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// --- 2. LOGIN ROUTE (Strict Approval Check) ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // A. STATIC ADMIN LOGIN
    if (email === 'admin@talkntype.com' && password === 'admin123') {
      return res.status(200).json({
        message: 'Welcome Boss!',
        user: {
          id: 'admin-static-id',
          fullName: 'Super Admin',
          email: 'admin@talkntype.com',
          role: 'admin', 
          subscription: { isActive: true, plan: 'unlimited' }
        }
      });
    }

    // B. NORMAL USER CHECK
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // --- SECURITY CHECK: IS ACCOUNT ACTIVE? ---
    if (user.role !== 'admin' && user.subscription && user.subscription.isActive === false) {
       return res.status(403).json({ 
         message: '⛔ Account Pending Approval. Contact Admin.' 
       });
    }

    res.status(200).json({
      message: 'Login successful!',
      user: {
        _id: user._id, 
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// --- 3. ADMIN: GET ALL USERS ---
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// --- 4. ADMIN: TOGGLE STATUS (Approve/Block User) ---
app.put('/api/admin/update-status/:id', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'subscription.isActive': isActive },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// --- 5. ADMIN: DELETE USER ---
app.delete('/api/admin/delete-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// --- 6. ADMIN: UPDATE SUBSCRIPTION (Start & End Date) ---
app.put('/api/admin/update-subscription/:id', async (req, res) => {
  try {
    const { startDate, expiryDate } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        'subscription.startDate': startDate,
        'subscription.expiryDate': expiryDate 
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, message: "Dates updated", user });
  } catch (error) {
    console.error("Date Update Error:", error);
    res.status(500).json({ message: 'Error updating dates' });
  }
});

// --- SERVER LISTEN ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});