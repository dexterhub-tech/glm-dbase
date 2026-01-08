import express from 'express';
import { getAuxanoCenters, getUnits } from '../controllers/listController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/centers', protect, getAuxanoCenters);
router.get('/units', protect, getUnits);

export default router;
