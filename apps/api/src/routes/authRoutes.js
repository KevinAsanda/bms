// apps/api/src/routes/authRoutes.js
import express from 'express';
import { login, logout, refresh } from '../controllers/authController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);

export default router;
