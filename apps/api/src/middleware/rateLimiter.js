// apps/api/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                      // 5 attempts
  message: { error: 'Too many login attempts. Account locked for 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
