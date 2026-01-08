import express from 'express';
import {
    authUser,
    registerUser,
    getUserProfile,
    createUser,
    getUsers,
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.post('/create-user', protect, admin, createUser);
router.get('/users', protect, admin, getUsers);

export default router;
