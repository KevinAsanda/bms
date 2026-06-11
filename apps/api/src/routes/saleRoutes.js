// apps/api/src/routes/saleRoutes.js
import express from 'express';
import { createSale, getSaleReceipt } from '../controllers/saleController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

router.post('/', authMiddleware, rbacMiddleware('CASHIER', 'OWNER'), createSale);
router.get('/:id/receipt', authMiddleware, getSaleReceipt);

export default router;
