import express from 'express';
import {
    getMembers,
    getMemberById,
    createMember,
    updateMember,
    deleteMember,
} from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getMembers)
    .post(protect, createMember);

router.route('/:id')
    .get(protect, getMemberById)
    .put(protect, updateMember)
    .delete(protect, deleteMember);

import { approveMember, assignToUnit, assignToAuxanoCenter } from '../controllers/memberController.js';

router.route('/:id/approve').put(protect, approveMember);
router.route('/:id/assign-unit').put(protect, assignToUnit);
router.route('/:id/assign-center').put(protect, assignToAuxanoCenter);

export default router;
