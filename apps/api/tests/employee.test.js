// apps/api/tests/employee.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

describe('Employee Endpoints (OWNER only)', () => {
  let adminToken;
  const adminCredentials = {
    email: 'admin@bms.local',
    password: 'Admin1234!',
  };

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(adminCredentials);
    adminToken = res.body.token;
  });

  it('should list all employees', async () => {
    const res = await request(app)
      .get('/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should create a new employee', async () => {
    const newEmployee = {
      name: 'Test Cashier',
      email: `cashier_${Date.now()}@bms.local`,
      password: 'Password123!',
      role: 'CASHIER',
    };

    const res = await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newEmployee);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(newEmployee.name);
    expect(res.body.role).toBe('CASHIER');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('should fail to create employee with duplicate email', async () => {
    const res = await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate',
        email: adminCredentials.email,
        password: 'Password123!',
        role: 'CASHIER',
      });

    expect(res.status).toBe(409);
  });

  it('should update employee details', async () => {
    // Create one to update
    const email = `update_${Date.now()}@bms.local`;
    const createRes = await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Before Update',
        email,
        password: 'Password123!',
        role: 'CASHIER',
      });
    
    const employeeId = createRes.body.id;

    const res = await request(app)
      .put(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'After Update' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('After Update');
  });

  it('should deactivate an employee', async () => {
    const email = `deactivate_${Date.now()}@bms.local`;
    const createRes = await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'To Deactivate',
        email,
        password: 'Password123!',
        role: 'STOCK_MANAGER',
      });
    
    const employeeId = createRes.body.id;

    const res = await request(app)
      .patch(`/employees/${employeeId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    
    const updated = await prisma.employee.findUnique({ where: { id: employeeId } });
    expect(updated.isActive).toBe(false);
  });

  it('should reset employee password', async () => {
    const email = `reset_${Date.now()}@bms.local`;
    const createRes = await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'To Reset',
        email,
        password: 'Password123!',
        role: 'CASHIER',
      });
    
    const employeeId = createRes.body.id;

    const res = await request(app)
      .post('/employees/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId,
        newPassword: 'NewPassword123!',
      });

    expect(res.status).toBe(200);

    // Verify new password works
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email,
        password: 'NewPassword123!',
      });
    
    expect(loginRes.status).toBe(200);
  });

  it('should block non-OWNER from employee management', async () => {
    // Create a cashier first
    const email = `cashier_test_${Date.now()}@bms.local`;
    await request(app)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Cashier Role',
        email,
        password: 'Password123!',
        role: 'CASHIER',
      });
    
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password: 'Password123!' });
    
    const cashierToken = loginRes.body.token;

    const res = await request(app)
      .get('/employees')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(res.status).toBe(403);
  });
});
