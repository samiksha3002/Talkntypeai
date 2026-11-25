import express from 'express';
import Client from '../models/Client.js';
import { ownerOf, pick, validObjectId, sendError } from '../utils/ownership.js';

const CLIENT_FIELDS = ['name', 'phone', 'email', 'address', 'notes'];

// All queries are scoped to the signed-in user (req.user from the verified JWT).
export function createClientsRouter({ clients = Client } = {}) {
  const router = express.Router();

  // POST /api/clients/add
  router.post('/add', async (req, res) => {
    try {
      const fields = pick(req.body, CLIENT_FIELDS);
      if (!fields.name || !fields.phone) {
        return res.status(400).json({ success: false, message: 'Missing required fields (Name and Phone are mandatory)' });
      }
      const created = await clients.create({ ...fields, userId: ownerOf(req) });
      res.status(201).json({ success: true, message: 'Client added successfully!', client: created });
    } catch (error) { sendError(res, error); }
  });

  // GET /api/clients/user/:userId  (:userId ignored; kept for frontend compatibility)
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

export default createClientsRouter();
