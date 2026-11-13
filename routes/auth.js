import { hashNewPassword, verifyPassword } from '../utils/passwords.js';
import express from 'express';
import User from '../models/user.js';
import { issueDraftSession } from '../middleware/draftAuth.js';

const router = express.Router();

// --- REGISTER ROUTE ---
router.post('/create-user', async (req, res) => {
  try {
    const { fullName, email, state, city, phone, executive, password } = req.body;

    if (email === 'admin@talkntype.com') {
      return res.status(400).json({ message: 'This email is reserved for Admin. Use Login page.' });
    }

    if(typeof password!=='string'||!password||Buffer.byteLength(password,'utf8')>72)return res.status(400).json({message:'New passwords must contain 1 to 72 UTF-8 bytes.'});
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({
      fullName, email, state, city, phone, executive,
      passwordHash: await hashNewPassword(password),
      role: 'user',
      subscription: { isActive: false, plan: 'demo', startDate: null, expiryDate: null }
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Registration successful! Wait for admin approval.' });

  } catch (error) {
    console.error("Registration failed.");
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if(typeof email!=='string'||email.length>254||typeof password!=='string'||!password)return res.status(400).json({message:'Invalid credentials'});
    // B. NORMAL USER CHECK
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!await verifyPassword(user,password)) {
          return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin' && user.subscription && user.subscription.isActive === false) {
       return res.status(403).json({ message: '⛔ Account Pending Approval. Contact Admin.' });
    }

    const userExpiryDate = user.subscription && user.subscription.expiryDate 
                            ? user.subscription.expiryDate.toISOString() 
                            : null;
    
    // Sessions are issued only for database-verified accounts, never static bypasses.
    let draftSession = null;
    try { draftSession = await issueDraftSession(user._id); } catch { /* Draft access fails closed. */ }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      draftSession,
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
    console.error("Login failed.");
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;