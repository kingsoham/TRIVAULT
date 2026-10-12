import { Router } from 'express';
import { register, login, getMe, logout, firebaseSync } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/firebase-sync', authRateLimiter, firebaseSync);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
