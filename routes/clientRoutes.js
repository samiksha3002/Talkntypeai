import express from 'express';
import Client from '../models/Client.js'; // Path check kar lena apne hisab se

const router = express.Router();

// 1. Naya Client add karne ke liye
router.post('/add', async (req, res) => {
  try {
    const { userId, fullName, email, phone, address, notes } = req.body;
    
    const newClient = new Client({
      userId,
      fullName,
      email,
      phone,
      address,
      notes
    });

    await newClient.save();
    res.status(201).json({ message: "Client saved successfully!", client: newClient });
  } catch (err) {
    res.status(500).json({ message: "Error saving client", error: err.message });
  }
});

// 2. Specific User ke sare clients lane ke liye
router.get('/user/:userId', async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(clients);
  } catch (err) {
    res.status(500).json({ message: "Error fetching clients", error: err.message });
  }
});

export default router;