// apps/api/src/routes/categoryRoutes.js
import express from 'express';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', authMiddleware, getCategories);
router.post('/', authMiddleware, rbacMiddleware('OWNER'), createCategory);
router.put('/:id', authMiddleware, rbacMiddleware('OWNER'), updateCategory);
router.delete('/:id', authMiddleware, rbacMiddleware('OWNER'), deleteCategory);

export default router;
