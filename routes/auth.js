import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// --- REGISTER ROUTE ---
router.post('/create-user', async (req, res) => {
  try {
    const { fullName, email, state, city, phone, executive, password } = req.body;

    if (email === 'admin@talkntype.com') {
      return res.status(400).json({ message: 'This email is reserved for Admin. Use Login page.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({
      fullName, email, state, city, phone, executive,
      password: password, 
      role: 'user',
      subscription: { isActive: false, plan: 'demo', startDate: null, expiryDate: null }
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Registration successful! Wait for admin approval.' });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // A. STATIC ADMIN LOGIN
    if (email === 'admin@talkntype.com' && password === 'admin123') {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1); 
        
      return res.status(200).json({
        message: 'Welcome Boss!',
        user: {
          id: 'admin-static-id',
          fullName: 'Super Admin',
          email: 'admin@talkntype.com',
          role: 'admin', 
          subscription: { isActive: true, plan: 'unlimited' }
        },
        expiryDate: oneYearFromNow.toISOString() 
      });
    }

    // B. NORMAL USER CHECK
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.password !== password) {
          return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin' && user.subscription && user.subscription.isActive === false) {
       return res.status(403).json({ message: '⛔ Account Pending Approval. Contact Admin.' });
    }

    const userExpiryDate = user.subscription && user.subscription.expiryDate 
                            ? user.subscription.expiryDate.toISOString() 
                            : null;
    
    res.status(200).json({
      message: 'Login successful!',
      user: {
        _id: user._id, 
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      },
      expiryDate: userExpiryDate
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

export default router;