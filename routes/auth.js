import express from 'express';
import User from '../models/user.js';
import { issueSession, publicUser } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/apiGuard.js';
import { hashNewPassword, checkPassword, passwordProblem, findWithPassword, upgradeLegacyPassword } from '../utils/passwords.js';

const router = express.Router();
const optionalText = (value, max) => value === undefined || value === null || (typeof value === 'string' && value.length <= max);

// --- REGISTER ROUTE ---
router.post('/create-user', registerLimiter, async (req, res) => {
  try {
    const { fullName, email, state, city, phone, executive, password } = req.body || {};
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 200 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 ||
      ![state, city, phone, executive].every(value => optionalText(value, 200))) {
      return res.status(400).json({ message: 'Please fill in your name and a valid email.' });
    }
    // At least 8 characters; at most 72 UTF-8 bytes so bcrypt never truncates.
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ message: problem });
    const normalizedEmail = email.trim().toLowerCase();

    // Optional: keep the configured administrator address from being registered as a normal user.
    const reserved = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (reserved && normalizedEmail === reserved) {
      return res.status(400).json({ message: 'This email cannot be registered.' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // New accounts store only the bcrypt hash (passwordHash), never plain text.
    const newUser = new User({
      fullName: fullName.trim(), email: normalizedEmail, state, city, phone, executive,
      passwordHash: await hashNewPassword(password),
      role: 'user',
      subscription: { isActive: false, plan: 'demo', startDate: null, expiryDate: null }
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful! Wait for admin approval.' });

  } catch {
    console.error("Registration failed.");   // no exception text: it may contain personal data
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 1024) {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }

    // Every account, including administrators, is verified against the database.
    // There is no hard-coded or environment-variable login bypass.
    const user = await findWithPassword(User, { email: email.trim().toLowerCase() });
    const check = await checkPassword(user, password);
    if (!user || !check.ok) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    // Legacy plain text: moved to passwordHash unless LEGACY_PASSWORD_UPGRADE is "off".
    if (check.needsUpgrade) await upgradeLegacyPassword(User, user, password);

    if (user.role !== 'admin' && user.subscription && user.subscription.isActive === false) {
       return res.status(403).json({ message: '⛔ Account Pending Approval. Contact Admin.' });
    }

    const userExpiryDate = user.subscription && user.subscription.expiryDate
                            ? user.subscription.expiryDate.toISOString()
                            : null;

    // The JWT is required by every protected API route, so login fails if it cannot be issued.
    let session;
    try { session = await issueSession(user._id); }
    catch {
      console.error('Login session could not be issued.');
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

  } catch {
    console.error("Login failed.");   // no exception text: it may contain personal data
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
