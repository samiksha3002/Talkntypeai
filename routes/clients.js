import express from 'express';
import Client from '../models/Client.js';
import { requireDraftAuth, matchingOwner } from '../middleware/tenantScope.js';

export function createClientRouter({clients:repository=Client,auth=requireDraftAuth}={}) {
const router = express.Router();
router.use(auth,matchingOwner);
router.param('userId',(req,res,next)=>matchingOwner(req,res,next));

// 1. ADD NEW CLIENT
// POST /api/clients/add
router.post('/add', async (req, res) => {
  try {
    const userId=req.draftOwnerId;
    const { name, phone, email, address, notes } = req.body;

    // Validation
    if (!userId || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields (Name and Phone are mandatory)',
      });
    }

    const newClient = new repository({
      userId,
      name,   // ✅ use "name" to match schema
      phone,
      email,
      address,
      notes,
    });

    await newClient.save();
    res.status(201).json({
      success: true,
      message: 'Client added successfully!',
      client: newClient,
    });
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 2. GET USER'S CLIENTS
// GET /api/clients/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const userId=req.draftOwnerId;
    const clients = await repository.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 3. DELETE CLIENT
// DELETE /api/clients/:clientId
router.delete('/:clientId', async (req, res) => {
  try {
    const removed=await repository.findOneAndDelete({_id:req.params.clientId,userId:req.draftOwnerId});
    if(!removed)return res.status(404).json({success:false,message:'Client not found'});
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, message: 'Error deleting client' });
  }
});

return router;
}
export default createClientRouter();
