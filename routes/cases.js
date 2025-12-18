import express from 'express';
import Case from '../models/case.js'; 

const router = express.Router();

// 1. ADD NEW CASE
router.post('/add', async (req, res) => {
  try {
    const { userId, caseName, caseNumber, courtName, hearingDate, description } = req.body;

    if (!userId || !caseName || !courtName || !hearingDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

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

// 2. GET USER'S CASES
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Check if userId is valid
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

    const cases = await Case.find({ userId }).sort({ hearingDate: 1 });
    res.status(200).json({ success: true, cases }); // Sending as object with cases array
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 3. DELETE CASE
router.delete('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const deletedCase = await Case.findByIdAndDelete(caseId);

    if (!deletedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.status(200).json({ success: true, message: 'Case deleted successfully' });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 4. UPDATE CASE
router.put('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const updatedCase = await Case.findByIdAndUpdate(caseId, req.body, { new: true });

    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    res.status(200).json({ success: true, message: 'Case updated successfully', case: updatedCase });
  } catch (error) {
    console.error("Error updating case:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;