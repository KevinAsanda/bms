// apps/api/src/routes/reportRoutes.js
import express from 'express';
import { 
  getDailySales, 
  getDashboardStats, 
  getCategoryPerformance 
} from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware('OWNER'));

router.get('/daily', getDailySales);
router.get('/dashboard', getDashboardStats);
router.get('/categories', getCategoryPerformance);

export default router;
