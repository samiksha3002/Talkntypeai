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
    if (!userId) return res.status(400).json({ success: false, message: "User ID missing" });

    const cases = await Case.find({ userId }).sort({ hearingDate: 1 });
    res.status(200).json({ success: true, cases });
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
// ✅ 6. GET SINGLE CASE (ADD THIS ROUTE)
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const singleCase = await Case.findById(caseId);

    if (!singleCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Frontend expects "case" key
    res.status(200).json({ success: true, case: singleCase }); 
  } catch (error) {
    console.error("Error fetching single case:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ✅ 5. IMPORT CASES FROM ECOURT TEXT DATA
router.post('/import', async (req, res) => {
  try {
    const { userId, textData } = req.body;

    if (!userId || !textData) {
      return res.status(400).json({ success: false, message: 'User ID or text data missing' });
    }

    const casesToInsert = [];
    
    // eCourt format ke hisaab se blocks mein split karna
    // Aksar cases ke beech khali lines hoti hain
    const caseBlocks = textData.split(/\n\s*\n/);

    caseBlocks.forEach((block) => {
      // Regex Patterns (Advanced)
      const caseNoMatch = block.match(/(?:Case No|CNR No|Number)\s*[:|-]?\s*(\S+)/i);
      const partyMatch = block.match(/(.+)\s+Vs\.?\s+(.+)/i);
      const dateMatch = block.match(/(?:Next Date|Hearing Date|Date)\s*[:|-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);
      const courtMatch = block.match(/(?:Court|Judge)\s*[:|-]?\s*(.+)/i);

      if (caseNoMatch) {
        casesToInsert.push({
          userId,
          caseName: partyMatch ? `${partyMatch[1].trim()} vs ${partyMatch[2].trim()}` : "Imported Case",
          caseNumber: caseNoMatch[1],
          courtName: courtMatch ? courtMatch[1].trim() : "Unknown Court",
          hearingDate: dateMatch ? dateMatch[1] : new Date(), // Agar date nahi mili toh current date
          description: `Auto-imported from eCourt file. Raw Data: ${block.substring(0, 50)}...`
        });
      }
    });

    if (casesToInsert.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid cases found in the file format.' });
    }

    // Database mein ek saath save karna (Efficiency ke liye)
    const importedCases = await Case.insertMany(casesToInsert);

    res.status(201).json({ 
      success: true, 
      message: `${importedCases.length} cases imported successfully!`,
      count: importedCases.length 
    });

  } catch (error) {
    console.error("Error importing cases:", error);
    res.status(500).json({ success: false, message: 'Server Error during import' });
  }
});

export default router;