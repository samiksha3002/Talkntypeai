import express from 'express';
import rateLimit from 'express-rate-limit';
import { createHash, timingSafeEqual } from 'node:crypto';
import User from '../models/user.js';
import { issueDraftSession } from '../middleware/draftAuth.js';
// Verify existing accounts without changing password records or accepting static bypasses.
export function createDraftSessionRouter({ users = User, issue = issueDraftSession } = {}) {
  const router = express.Router();
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'Too many sign-in attempts. Try again later.' } }));
  router.post('/', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || !password || password.length > 1024) return res.status(400).json({ success: false, error: 'Enter your email and password.' });
    try {
      const user = await users.findOne({ email: email.trim().toLowerCase() });
      const digest = value => createHash('sha256').update(value).digest();
      if (!user || typeof user.password !== 'string' || !timingSafeEqual(digest(password), digest(user.password))) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      if (user.role !== 'admin' && (!user.subscription?.isActive || (user.subscription.expiryDate && new Date(user.subscription.expiryDate) <= new Date()))) return res.status(403).json({ success: false, error: 'Your account does not currently have draft access.' });
      const session = await issue(user._id);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: session });
    } catch { res.status(503).json({ success: false, error: 'Draft sign-in is temporarily unavailable.' }); }
  });
  return router;
}
export default createDraftSessionRouter();
