// routes/cases.js
import express from 'express';

// FIX: Import as 'Case' (Capital C) to avoid reserved keyword 'case'
// The file path remains '../models/case.js' (small c) as you have it on your PC
import Case from '../models/case.js'; 

const router = express.Router();

// 1. ADD NEW CASE (POST /api/cases/add)
router.post('/add', async (req, res) => {
  try {
    const { userId, caseName, caseNumber, courtName, hearingDate, description } = req.body;

    // Validation
    if (!userId || !caseName || !courtName || !hearingDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Now 'Case' matches the import name above
    const newCase = new Case({
      userId,
      caseName,
      caseNumber,
      courtName,
      hearingDate,
      description
    });

    await newCase.save();
    res.status(201).json({ success: true, message: 'Case added successfully!', case: newCase });

  } catch (error) {
    console.error("Error adding case:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 2. GET USER'S CASES (GET /api/cases/user/:userId)
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Now 'Case' matches the import name above
        const cases = await Case.find({ userId }).sort({ hearingDate: 1 }); 
        res.json({ success: true, cases });
    } catch (error) {
        console.error("Error fetching cases:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;