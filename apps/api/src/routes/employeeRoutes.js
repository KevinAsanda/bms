// apps/api/src/routes/employeeRoutes.js
import express from 'express';
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  deactivateEmployee,
  resetEmployeePassword
} from '../controllers/employeeController.js';
import { authMiddleware } from '../middleware/auth.js';
import { rbacMiddleware } from '../middleware/rbac.js';

const router = express.Router();

// All employee routes are OWNER only
router.use(authMiddleware);
router.use(rbacMiddleware('OWNER'));

router.get('/', getAllEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.patch('/:id/deactivate', deactivateEmployee);
router.post('/reset-password', resetEmployeePassword);

export default router;
