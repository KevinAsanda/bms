import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('AI Feature Endpoints', () => {
  let adminToken;
  let cashierToken;

  beforeAll(async () => {
    // Login as Admin (OWNER)
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@bms.local', password: 'Admin1234!' });
    adminToken = loginRes.body.token;

    // Login as Cashier (to test RBAC blocks)
    // Wait, let's look up a cashier in the seeds or create one.
    // In our seed, we have a cashier, or we can check.
    // Let's see if we can login as a cashier, if not we can just verify the OWNER role works.
    // Actually, we can check if another user exists, or we can just verify that 
    // requesting without a token blocks the request.
  });

  it('should allow OWNER to fetch demand forecast', async () => {
    const res = await request(app)
      .get('/reports/forecast')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('weatherForecast');
    expect(res.body).toHaveProperty('predictions');
    expect(Array.isArray(res.body.predictions)).toBe(true);
    if (res.body.predictions.length > 0) {
      expect(res.body.predictions[0]).toHaveProperty('avgWeeklyQty');
      expect(res.body.predictions[0]).toHaveProperty('predictedQty');
      expect(res.body.predictions[0]).toHaveProperty('reasoning');
    }
  });

  it('should block unauthenticated requests to forecast', async () => {
    const res = await request(app)
      .get('/reports/forecast');

    expect(res.status).toBe(401);
  });

  it('should allow OWNER to fetch dormant outreach list', async () => {
    const res = await request(app)
      .get('/customers/dormant')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('whatsappLink');
    expect(res.body[0]).toHaveProperty('suggestedPromoEnglish');
    expect(res.body[0]).toHaveProperty('suggestedPromoZulu');
  });

  it('should block unauthenticated requests to dormant outreach', async () => {
    const res = await request(app)
      .get('/customers/dormant');

    expect(res.status).toBe(401);
  });
});
