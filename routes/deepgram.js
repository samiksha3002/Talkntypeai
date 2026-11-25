import express from 'express';
import { unavailable } from '../middleware/releaseContainment.js';
const router = express.Router();
router.use(unavailable);
export default router;
