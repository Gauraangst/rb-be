import express from 'express';
import { authUser, registerUser, getUserProfile, updateUserProfile } from '../controllers/users.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
