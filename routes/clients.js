import express from 'express';
import Client from '../models/Client.js';
import { requireDraftAuth, matchingOwner } from '../middleware/tenantScope.js';
import { ownerOf, pick, validObjectId, sendError, createRecord } from '../utils/ownership.js';

const CLIENT_FIELDS = ['name', 'phone', 'email', 'address', 'notes'];

// All queries are scoped to the signed-in user from the verified session.
// A userId in the URL, query or body must match that user (matchingOwner: 403).
export function createClientRouter({ clients = Client, auth = requireDraftAuth } = {}) {
  const router = express.Router();
  router.use(auth, matchingOwner);
  router.param('userId', (req, res, next) => matchingOwner(req, res, next));

  // POST /api/clients/add
  router.post('/add', async (req, res) => {
    try {
      const fields = pick(req.body, CLIENT_FIELDS);
      if (!fields.name || !fields.phone) {
        return res.status(400).json({ success: false, message: 'Missing required fields (Name and Phone are mandatory)' });
      }
      const created = await createRecord(clients, { ...fields, userId: ownerOf(req) });
      res.status(201).json({ success: true, message: 'Client added successfully!', client: created });
    } catch (error) { sendError(res, error); }
  });

  // GET /api/clients/user/:userId
  router.get('/user/:userId', async (req, res) => {
    try {
      const rows = await clients.find({ userId: ownerOf(req) }).sort({ createdAt: -1 });
      res.json({ success: true, clients: rows });
    } catch (error) { sendError(res, error); }
  });

  // DELETE /api/clients/:clientId
  router.delete('/:clientId', async (req, res) => {
    if (!validObjectId(req.params.clientId)) return res.status(400).json({ success: false, message: 'Invalid client ID' });
    try {
      const deleted = await clients.findOneAndDelete({ _id: req.params.clientId, userId: ownerOf(req) });
      if (!deleted) return res.status(404).json({ success: false, message: 'Client not found' });
      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) { sendError(res, error, 'Error deleting client'); }
  });

  return router;
}

export const createClientsRouter = createClientRouter;   // name used on security/critical-fixes
export default createClientRouter();
