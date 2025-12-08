import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// TOGGLE STATUS
router.put('/update-status/:id', async (req, res) => {
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

// UPDATE SUBSCRIPTION
router.put('/update-subscription/:id', async (req, res) => {
  try {
    const { startDate, expiryDate } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'subscription.startDate': startDate, 'subscription.expiryDate': expiryDate },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: "Dates updated", user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating dates' });
  }
});

// DELETE USER
router.delete('/delete-user/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;