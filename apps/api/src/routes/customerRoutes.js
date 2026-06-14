// apps/api/src/routes/customerRoutes.js
import express from 'express';
import { getCustomers, createCustomer, getDormantOutreach } from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCustomers);
router.get('/dormant', authMiddleware, getDormantOutreach);
router.post('/', authMiddleware, createCustomer);

export default router;
