// apps/api/tests/stock.test.js
import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/utils/prisma.js';

describe('Stock Management Endpoints', () => {
  let adminToken;
  let productId;

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
          name: 'Test Stock Product',
          barcode: `TEST-STOCK-${Date.now()}`,
          pricePerUnit: 12.00,
          pricingType: 'FIXED',
          unit: 'each',
          categoryId: category.id,
          stock: {
            create: {
              quantity: 10,
              lowThreshold: 2
            }
          }
        },
        include: { stock: true }
      });
    }
    productId = prod.id;
  }, 30000);

  it('should list stock levels', async () => {
    const res = await request(app)
      .get('/stock')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('quantity');
  });

  it('should adjust stock and create record', async () => {
    const initialStock = await prisma.stock.findUnique({ where: { productId } });
    
    const res = await request(app)
      .post('/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productId,
        changeQty: -5,
        reason: 'WASTAGE',
        notes: 'Testing adjustment'
      });

    expect(res.status).toBe(200);
    
    const finalStock = await prisma.stock.findUnique({ where: { productId } });
    expect(parseFloat(finalStock.quantity)).toBe(parseFloat(initialStock.quantity) - 5);

    // Verify Adjustment row
    const adj = await prisma.stockAdjustment.findFirst({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    expect(adj.reason).toBe('WASTAGE');
    expect(parseFloat(adj.changeQty)).toBe(-5);
  });

  it('should fetch adjustment history', async () => {
    const res = await request(app)
      .get('/stock/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('product');
    expect(res.body[0]).toHaveProperty('employee');
  });
});
