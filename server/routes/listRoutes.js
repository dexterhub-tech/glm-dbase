import express from 'express';
import { getAuxanoCenters, getUnits, getPastors } from '../controllers/listController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/centers', protect, getAuxanoCenters);
router.get('/units', protect, getUnits);
router.get('/pastors', protect, getPastors);

export default router;
