import express from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/user.js';
import { issueDraftSession } from '../middleware/draftAuth.js';
import { checkPassword, findWithPassword, upgradeLegacyPassword } from '../utils/passwords.js';
// Verify existing accounts (passwordHash, or legacy plain text upgraded unless
// LEGACY_PASSWORD_UPGRADE is "off") without static bypasses.
export function createDraftSessionRouter({ users = User, issue = issueDraftSession } = {}) {
  const router = express.Router();
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'Too many sign-in attempts. Try again later.' } }));
  router.post('/', async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || !password || password.length > 1024) return res.status(400).json({ success: false, error: 'Enter your email and password.' });
    try {
      const user = await findWithPassword(users, { email: email.trim().toLowerCase() });
      const check = await checkPassword(user, password);
      if (!user || !check.ok) return res.status(401).json({ success: false, error: 'Invalid credentials.' });
      if (check.needsUpgrade) await upgradeLegacyPassword(users, user, password);
      if (user.role !== 'admin' && (!user.subscription?.isActive || (user.subscription.expiryDate && new Date(user.subscription.expiryDate) <= new Date()))) return res.status(403).json({ success: false, error: 'Your account does not currently have draft access.' });
      const session = await issue(user._id);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, data: session });
    } catch { res.status(503).json({ success: false, error: 'Draft sign-in is temporarily unavailable.' }); }
  });
  return router;
}
export default createDraftSessionRouter();
