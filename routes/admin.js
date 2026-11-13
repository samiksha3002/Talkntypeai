import express from 'express';
import User from '../models/user.js';
import { requireDraftAuth } from '../middleware/draftAuth.js';

const publicUser = user => {
  if (!user) return user;
  const value = user.toObject ? user.toObject() : user;
  return Object.fromEntries(['_id','fullName','email','state','city','phone','executive','role','subscription','createdAt','updatedAt'].map(key => [key,value[key]]));
};
export function createAdminRouter({ users: repository = User, auth = requireDraftAuth } = {}) {
const router = express.Router();
router.use(auth, (req,res,next) => req.draftRole === 'admin' ? next() : res.status(403).json({message:'Administrator access required.'}));
router.use((req,res,next) => {res.set('Cache-Control','no-store');next();});

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const users = await repository.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json(users.map(publicUser));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// TOGGLE STATUS
router.put('/update-status/:id', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await repository.findByIdAndUpdate(
      req.params.id,
      { 'subscription.isActive': isActive },
      { new: true }
    );
    res.json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// UPDATE SUBSCRIPTION
router.put('/update-subscription/:id', async (req, res) => {
  try {
    const { startDate, expiryDate } = req.body;
    const user = await repository.findByIdAndUpdate(
      req.params.id,
      { 'subscription.startDate': startDate, 'subscription.expiryDate': expiryDate },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: "Dates updated", user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating dates' });
  }
});

// DELETE USER
router.delete('/delete-user/:id', async (req, res) => {
  try {
    const deletedUser = await repository.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

return router;
}
export default createAdminRouter();