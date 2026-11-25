import express from 'express';
import User from '../models/user.js';
import { requireAdmin, publicUser } from '../middleware/auth.js';

const SAFE_FIELDS = 'fullName email phone state city executive role subscription createdAt updatedAt';
const validId = value => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
const view = user => user && { ...publicUser(user), phone: user.phone, state: user.state, city: user.city,
  executive: user.executive, createdAt: user.createdAt, updatedAt: user.updatedAt };
const date = value => {
  if (value === null || value === '') return null;
  const parsed = new Date(value);
  return typeof value === 'string' && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
};

// Every route requires a valid JWT whose user has role "admin" in the database.
// Only non-admin accounts can be changed or deleted through these endpoints.
export function createAdminRouter({ users = User, auth = requireAdmin } = {}) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth,
    // Defence in depth (from main): even if a weaker auth middleware is injected, the
    // role read from the database by that middleware must be "admin".
    (req, res, next) => (req.draftRole === 'admin' || req.user?.role === 'admin')
      ? next() : res.status(403).json({ message: 'Administrator access required.' }));

  router.get('/users', async (req, res) => {
    try {
      const rows = await users.find({ role: 'user' }).select(SAFE_FIELDS).sort({ createdAt: -1 }).lean();
      res.json(rows.map(view));
    } catch {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  router.put('/update-status/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false.' });
    try {
      const user = await users.findOneAndUpdate({ _id: req.params.id, role: 'user' },
        { $set: { 'subscription.isActive': req.body.isActive } }, { new: true }).select(SAFE_FIELDS).lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(view(user));
    } catch {
      res.status(500).json({ message: 'Error updating status' });
    }
  });

  router.put('/update-subscription/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const startDate = date(req.body?.startDate), expiryDate = date(req.body?.expiryDate);
    if (startDate === undefined || expiryDate === undefined) return res.status(400).json({ message: 'Dates must be valid (YYYY-MM-DD).' });
    if (startDate && expiryDate && expiryDate <= startDate) return res.status(400).json({ message: 'Expiry must be after the start date.' });
    try {
      const user = await users.findOneAndUpdate({ _id: req.params.id, role: 'user' },
        { $set: { 'subscription.startDate': startDate, 'subscription.expiryDate': expiryDate } }, { new: true }).select(SAFE_FIELDS).lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ success: true, message: 'Dates updated', user: view(user) });
    } catch {
      res.status(500).json({ message: 'Error updating dates' });
    }
  });

  router.delete('/delete-user/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    try {
      const deleted = await users.findOneAndDelete({ _id: req.params.id, role: 'user' });
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User deleted successfully' });
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
}

export default createAdminRouter();
