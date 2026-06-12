// apps/api/src/controllers/customerController.js
import { prisma } from '../utils/prisma.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid SA phone number').optional().nullable(),
});

export async function getCustomers(req, res) {
  const { query } = req.query;
  try {
    // Fetch customers
    const allCustomers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });

    const decryptedCustomers = allCustomers.map(customer => ({
      ...customer,
      phone: decrypt(customer.phone)
    }));

    if (query) {
      const filtered = decryptedCustomers.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) || 
        (customer.phone && customer.phone.includes(query))
      );
      return res.json(filtered.slice(0, 10));
    }

    res.json(decryptedCustomers.slice(0, 10));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

export async function createCustomer(req, res) {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { name, phone } = parsed.data;

  try {
    if (phone) {
      // Manually check for duplicates since encrypted values are non-deterministic (random IV)
      const allCustomers = await prisma.customer.findMany({
        where: { phone: { not: null } }
      });
      const duplicate = allCustomers.find(c => decrypt(c.phone) === phone);
      if (duplicate) {
        return res.status(409).json({ error: 'Phone number already exists' });
      }
    }

    // Encrypt phone number before database insertion
    const encryptedPhone = phone ? encrypt(phone) : null;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: encryptedPhone
      },
    });

    res.status(201).json({
      ...customer,
      phone: decrypt(customer.phone)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
}
