// apps/api/src/routes/stockRoutes.js
import express from 'express';
import { 
  getStock, 
  adjustStock, 
  receiveStock, 
  getAdjustmentHistory 
} from '../controllers/stockController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware('OWNER', 'STOCK_MANAGER'));

router.get('/', getStock);
router.post('/adjust', adjustStock);
router.post('/receive', receiveStock);
router.get('/history', getAdjustmentHistory);
router.get('/history/:productId', getAdjustmentHistory);

export default router;
