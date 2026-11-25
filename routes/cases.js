import express from 'express';
import Case from '../models/case.js';
import { requireDraftAuth, matchingOwner } from '../middleware/tenantScope.js';
import { ownerOf, pick, validObjectId, sendError, createRecord } from '../utils/ownership.js';

const CASE_FIELDS = ['caseName', 'caseNumber', 'courtName', 'hearingDate', 'description', 'status'];

// All queries are scoped to the signed-in user from the verified session.
// A userId in the URL, query or body must match that user (matchingOwner: 403).
export function createCaseRouter({ cases = Case, auth = requireDraftAuth } = {}) {
  const router = express.Router();
  router.use(auth, matchingOwner);
  router.param('userId', (req, res, next) => matchingOwner(req, res, next));

  router.post('/add', async (req, res) => {
    try {
      const fields = pick(req.body, CASE_FIELDS);
      if (!fields.caseName || !fields.courtName || !fields.hearingDate) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      const created = await createRecord(cases, { ...fields, userId: ownerOf(req) });
      res.status(201).json({ success: true, message: 'Case added successfully!', case: created });
    } catch (error) { sendError(res, error); }
  });

  router.get('/user/:userId', async (req, res) => {
    try {
      const rows = await cases.find({ userId: ownerOf(req) }).sort({ hearingDate: 1 });
      res.status(200).json({ success: true, cases: rows });
    } catch (error) { sendError(res, error); }
  });

  router.delete('/:caseId', async (req, res) => {
    if (!validObjectId(req.params.caseId)) return res.status(400).json({ success: false, message: 'Invalid case ID' });
    try {
      const deleted = await cases.findOneAndDelete({ _id: req.params.caseId, userId: ownerOf(req) });
      if (!deleted) return res.status(404).json({ success: false, message: 'Case not found' });
      res.status(200).json({ success: true, message: 'Case deleted successfully' });
    } catch (error) { sendError(res, error); }
  });

  router.put('/:caseId', async (req, res) => {
    if (!validObjectId(req.params.caseId)) return res.status(400).json({ success: false, message: 'Invalid case ID' });
    try {
      const fields = pick(req.body, CASE_FIELDS);
      const updated = await cases.findOneAndUpdate({ _id: req.params.caseId, userId: ownerOf(req) }, { $set: fields }, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Case not found' });
      res.status(200).json({ success: true, message: 'Case updated successfully', case: updated });
    } catch (error) { sendError(res, error); }
  });

  router.get('/:caseId', async (req, res) => {
    if (!validObjectId(req.params.caseId)) return res.status(400).json({ success: false, message: 'Invalid case ID' });
    try {
      const found = await cases.findOne({ _id: req.params.caseId, userId: ownerOf(req) });
      if (!found) return res.status(404).json({ success: false, message: 'Case not found' });
      res.status(200).json({ success: true, case: found });
    } catch (error) { sendError(res, error); }
  });

  // Import cases from pasted eCourt text.
  router.post('/import', async (req, res) => {
    try {
      const userId = ownerOf(req);
      const { textData } = req.body || {};
      if (typeof textData !== 'string' || !textData.trim() || textData.length > 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'Text data missing' });
      }
      const casesToInsert = [];
      for (const block of textData.split(/\n\s*\n/)) {
        const caseNoMatch = block.match(/(?:Case No|CNR No|Number)\s*[:|-]?\s*(\S+)/i);
        const partyMatch = block.match(/(.+)\s+Vs\.?\s+(.+)/i);
        const dateMatch = block.match(/(?:Next Date|Hearing Date|Date)\s*[:|-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i);
        const courtMatch = block.match(/(?:Court|Judge)\s*[:|-]?\s*(.+)/i);
        if (caseNoMatch) {
          casesToInsert.push({
            userId,
            caseName: partyMatch ? `${partyMatch[1].trim()} vs ${partyMatch[2].trim()}` : 'Imported Case',
            caseNumber: caseNoMatch[1],
            courtName: courtMatch ? courtMatch[1].trim() : 'Unknown Court',
            hearingDate: dateMatch ? dateMatch[1] : new Date(),
            description: `Auto-imported from eCourt file. Raw Data: ${block.substring(0, 50)}...`,
          });
        }
      }
      if (casesToInsert.length === 0) return res.status(400).json({ success: false, message: 'No valid cases found in the file format.' });
      const imported = await cases.insertMany(casesToInsert);
      res.status(201).json({ success: true, message: `${imported.length} cases imported successfully!`, count: imported.length });
    } catch (error) { sendError(res, error, 'Server Error during import'); }
  });

  return router;
}

export const createCasesRouter = createCaseRouter;   // name used on security/critical-fixes
export default createCaseRouter();
