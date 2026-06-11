// apps/api/src/controllers/customerController.js
import { prisma } from '../utils/prisma.js';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid SA phone number').optional().nullable(),
});

export async function getCustomers(req, res) {
  const { query } = req.query;
  try {
    const customers = await prisma.customer.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      } : undefined,
      take: 10,
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

export async function createCustomer(req, res) {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const customer = await prisma.customer.create({
      data: parsed.data,
    });
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Phone number already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
}
