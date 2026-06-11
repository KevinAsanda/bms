// apps/api/tests/category.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Category Endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@bms.local', password: 'Admin1234!' });
    adminToken = loginRes.body.token;
  });

  it('should list categories', async () => {
    const res = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('_count');
  });

  it('should create a category', async () => {
    const res = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `New Cat ${Date.now()}` });

    expect(res.status).toBe(201);
  });
});
