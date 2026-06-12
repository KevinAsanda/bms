// apps/api/src/controllers/authController.js
import { prisma } from '../utils/prisma.js';
import { verifyPassword, generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  try {
    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, employee.passwordHash);
    if (!isValid) {
      await logAudit(prisma, {
        employeeId: employee.id,
        action: 'LOGIN_FAILURE',
        entityType: 'Employee',
        entityId: employee.id,
        metadata: {},
        ipAddress: req.ip,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: employee.id, role: employee.role, email: employee.email };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await logAudit(prisma, {
      employeeId: employee.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'Employee',
      entityId: employee.id,
      metadata: {},
      ipAddress: req.ip,
    });

    res.json({ token, user: { id: employee.id, name: employee.name, role: employee.role, email: employee.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const employee = await prisma.employee.findUnique({ where: { id: payload.id } });
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'User no longer active' });
    }

    const newPayload = { id: employee.id, role: employee.role, email: employee.email };
    const newToken = generateToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token invalid or expired' });
  }
}
