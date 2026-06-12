// apps/api/tests/product.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

describe('Product Endpoints', () => {
  let adminToken;
  let categoryId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@bms.local', password: 'Admin1234!' });
    adminToken = loginRes.body.token;

    const catRes = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    categoryId = catRes.body[0].id;
  });

  it('should create a product', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product',
        barcode: `TEST-${Date.now()}`,
        categoryId,
        pricePerUnit: 10.50,
        pricingType: 'FIXED',
        unit: 'each'
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Product');
  });

  it('should list products', async () => {
    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
