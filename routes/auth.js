import express from 'express';
import User from '../models/user.js';
import { issueSession, publicUser } from '../middleware/auth.js';

const router = express.Router();

// --- REGISTER ROUTE ---
router.post('/create-user', async (req, res) => {
  try {
    const { fullName, email, state, city, phone, executive, password } = req.body;

    // Optional: keep the configured administrator address from being registered as a normal user.
    const reserved = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (reserved && typeof email === 'string' && email.trim().toLowerCase() === reserved) {
      return res.status(400).json({ message: 'This email cannot be registered.' });
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
    console.error("Registration Error:", error?.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 1024) {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }

    // Every account, including administrators, is verified against the database.
    // There is no hard-coded or environment-variable login bypass.
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== 'admin' && user.subscription && user.subscription.isActive === false) {
       return res.status(403).json({ message: '⛔ Account Pending Approval. Contact Admin.' });
    }

    const userExpiryDate = user.subscription && user.subscription.expiryDate
                            ? user.subscription.expiryDate.toISOString()
                            : null;

    // The JWT is required by every protected API route, so login fails if it cannot be issued.
    let session;
    try { session = await issueSession(user._id); }
    catch (error) {
      console.error('Login session error:', error?.message);
      return res.status(503).json({ message: 'Sign-in is temporarily unavailable.' });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      draftSession: session,   // name kept for the existing frontend
      token: session.token,
      message: 'Login successful!',
      user: publicUser(user),
      expiryDate: userExpiryDate
    });

  } catch (error) {
    console.error("Login Error:", error?.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;