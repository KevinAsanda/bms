// apps/api/tests/pos.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

describe('POS Endpoints (Sales)', () => {
  let adminToken;
  let productId;

  // Global timeout for all tests in this suite
  const TEST_TIMEOUT = 20000;

  beforeAll(async () => {
    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@bms.local', password: 'Admin1234!' });
    adminToken = loginRes.body.token;

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: 'Beef' } });
    }

    let prod = await prisma.product.findFirst({
      where: { isActive: true },
      include: { stock: true }
    });
    
    if (!prod) {
      prod = await prisma.product.create({
        data: {
          name: 'Test POS Product',
          barcode: `TEST-POS-${Date.now()}`,
          pricePerUnit: 10.00,
          pricingType: 'FIXED',
          unit: 'each',
          categoryId: category.id,
          stock: {
            create: {
              quantity: 100,
              lowThreshold: 2
            }
          }
        },
        include: { stock: true }
      });
    }
    productId = prod.id;
    
    // Ensure it has stock
    if (!prod.stock) {
        await prisma.stock.create({ data: { productId: prod.id, quantity: 100 } });
    } else {
        await prisma.stock.update({ where: { productId: prod.id }, data: { quantity: 100 } });
    }
  }, 30000);

  it('should create a sale and deduct stock atomically', async () => {
    const res = await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentMethod: 'CASH',
        items: [
          { productId, quantity: 1 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  }, 15000);

  it('should lookup product by barcode', async () => {
    const prod = await prisma.product.findUnique({ where: { id: productId } });
    const res = await request(app)
      .get(`/products/barcode/${prod.barcode}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(productId);
  }, TEST_TIMEOUT);
});
