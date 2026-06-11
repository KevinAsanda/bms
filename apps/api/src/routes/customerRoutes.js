// apps/api/src/routes/customerRoutes.js
import express from 'express';
import { getCustomers, createCustomer } from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCustomers);
router.post('/', authMiddleware, createCustomer);

export default router;
