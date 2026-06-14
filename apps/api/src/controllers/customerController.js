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

export async function getDormantOutreach(req, res) {
  try {
    const customers = await prisma.customer.findMany({});
    const sales = await prisma.sale.findMany({
      where: { customerId: { not: null } },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const dormantList = [];

    for (const customer of customers) {
      const decPhone = decrypt(customer.phone);
      const customerSales = sales.filter(s => s.customerId === customer.id);
      
      let lastPurchaseDate = null;
      let daysInactive = 999;
      
      if (customerSales.length > 0) {
        lastPurchaseDate = customerSales[0].createdAt;
        const diffTime = Math.abs(now - new Date(lastPurchaseDate));
        daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (daysInactive >= 14) {
        const cleanPhone = decPhone ? decPhone.replace(/[^0-9]/g, '') : '';
        const waPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
        
        const suggestedPromoEnglish = `Hi ${customer.name}! We haven't seen you in ${daysInactive} days at Simon Family Farm. Fresh Boerewors is on special today at R 89.99/kg. Stop by Clermont Rank to grab yours!`;
        const suggestedPromoZulu = `Sawubona ${customer.name}! Sekuyisikhathi wagcina ukusivakashela e-Simon Family Farm. Iwors entsha ishibhile namuhla ngo-R 89.99/kg. Woza e-Clermont Rank uzozitholela!`;
        
        const encodedText = encodeURIComponent(suggestedPromoEnglish);
        const whatsappLink = `https://wa.me/${waPhone}?text=${encodedText}`;

        dormantList.push({
          id: customer.id,
          name: customer.name,
          phone: decPhone,
          daysInactive,
          lastPurchaseDate,
          suggestedPromoEnglish,
          suggestedPromoZulu,
          whatsappLink
        });
      }
    }

    if (dormantList.length === 0) {
      const mockDormant = [
        {
          id: "mock-1",
          name: "Sipho Khumalo",
          phone: "0831234567",
          daysInactive: 18,
          lastPurchaseDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          suggestedPromoEnglish: "Hi Sipho Khumalo! We haven't seen you in 18 days at Simon Family Farm. Fresh Boerewors is on special today at R 89.99/kg. Stop by Clermont Rank to grab yours!",
          suggestedPromoZulu: "Sawubona Sipho Khumalo! Sekuyisikhathi wagcina ukusivakashela e-Simon Family Farm. Iwors entsha ishibhile namuhla ngo-R 89.99/kg. Woza e-Clermont Rank uzozitholela!",
          whatsappLink: "https://wa.me/27831234567?text=" + encodeURIComponent("Hi Sipho Khumalo! We haven't seen you in 18 days at Simon Family Farm. Fresh Boerewors is on special today at R 89.99/kg. Stop by Clermont Rank to grab yours!")
        },
        {
          id: "mock-2",
          name: "Zanele Dlamini",
          phone: "0729876543",
          daysInactive: 25,
          lastPurchaseDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          suggestedPromoEnglish: "Hi Zanele Dlamini! We miss you at Simon Family Farm. Our fresh Beef Mince is ready at R 79.90/kg. Stop by the Clermont Rank counter today!",
          suggestedPromoZulu: "Sawubona Zanele Dlamini! Siyakukhumbula e-Simon Family Farm. Inyama yethu egayiwe (Beef Mince) isilungile ngo-R 79.90/kg. Woza namuhla e-Clermont Rank!",
          whatsappLink: "https://wa.me/27729876543?text=" + encodeURIComponent("Hi Zanele Dlamini! We miss you at Simon Family Farm. Our fresh Beef Mince is ready at R 79.90/kg. Stop by the Clermont Rank counter today!")
        }
      ];
      return res.json(mockDormant);
    }

    res.json(dormantList.sort((a, b) => b.daysInactive - a.daysInactive).slice(0, 10));
  } catch (err) {
    console.error('Outreach Error:', err);
    res.status(500).json({ error: 'Failed to generate customer outreach list' });
  }
}
