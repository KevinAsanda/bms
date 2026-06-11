// apps/api/src/routes/productRoutes.js
import express from 'express';
import { getProducts, getProductByBarcode, createProduct, updateProduct, archiveProduct } from '../controllers/productController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', authMiddleware, getProducts);
router.get('/barcode/:code', authMiddleware, getProductByBarcode);
router.post('/', authMiddleware, rbacMiddleware('OWNER'), createProduct);
router.put('/:id', authMiddleware, rbacMiddleware('OWNER'), updateProduct);
router.patch('/:id/archive', authMiddleware, rbacMiddleware('OWNER'), archiveProduct);

export default router;
