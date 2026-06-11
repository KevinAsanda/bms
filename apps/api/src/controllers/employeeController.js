// apps/api/src/controllers/employeeController.js
import { prisma } from '../utils/prisma.js';
import { hashPassword, passwordSchema } from '../utils/auth.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(['OWNER', 'CASHIER', 'STOCK_MANAGER']),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['OWNER', 'CASHIER', 'STOCK_MANAGER']).optional(),
  isActive: z.boolean().optional(),
});

export async function getAllEmployees(req, res) {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
}

export async function createEmployee(req, res) {
  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await hashPassword(password);

    const employee = await prisma.employee.create({
      data: { name, email, passwordHash, role },
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: employee.id,
      metadata: { email, role },
    });

    const { passwordHash: _, ...result } = employee;
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
}

export async function updateEmployee(req, res) {
  const { id } = req.params;
  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'EMPLOYEE_UPDATED',
      entity: 'Employee',
      entityId: employee.id,
      metadata: parsed.data,
    });

    const { passwordHash: _, ...result } = employee;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
}

export async function deactivateEmployee(req, res) {
  const { id } = req.params;

  try {
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate yourself' });
    }

    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'EMPLOYEE_DEACTIVATED',
      entity: 'Employee',
      entityId: id,
    });

    res.json({ message: 'Employee deactivated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
}

export async function resetEmployeePassword(req, res) {
  const { employeeId, newPassword } = req.body;
  
  const parsedPassword = passwordSchema.safeParse(newPassword);
  if (!parsedPassword.success) {
    return res.status(422).json({ error: parsedPassword.error.errors[0].message });
  }

  try {
    const passwordHash = await hashPassword(newPassword);
    
    await prisma.employee.update({
      where: { id: employeeId },
      data: { passwordHash },
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'PASSWORD_RESET',
      entity: 'Employee',
      entityId: employeeId,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
}
