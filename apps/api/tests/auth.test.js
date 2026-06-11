// apps/api/tests/auth.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

describe('Auth Endpoints', () => {
  const adminCredentials = {
    email: 'admin@bms.local',
    password: 'Admin1234!',
  };

  it('should login successfully with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(adminCredentials);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(adminCredentials.email);
    expect(res.header['set-cookie']).toBeDefined();
  });

  it('should fail to login with invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: adminCredentials.email,
        password: 'WrongPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('should fail to login with non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@bms.local',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
  });

  it('should refresh token successfully', async () => {
    // First login to get a refresh token
    const loginRes = await request(app)
      .post('/auth/login')
      .send(adminCredentials);

    const refreshToken = loginRes.header['set-cookie'][0].split(';')[0].split('=')[1];

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should logout successfully', async () => {
    const res = await request(app)
      .post('/auth/logout');

    expect(res.status).toBe(200);
    expect(res.header['set-cookie'][0]).toMatch(/refreshToken=;/);
  });
});
