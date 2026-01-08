import express from 'express';
import { registerPublicMember } from '../controllers/memberController.js';

const router = express.Router();

router.post('/register-member', registerPublicMember);

export default router;
