// apps/api/src/controllers/saleController.js
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

const createSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'EFT']),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive().max(1000),
    weightKg: z.number().positive().max(999).nullable().optional(),
  })).min(1, 'A sale must have at least one item'),
});

export async function createSale(req, res) {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { customerId, paymentMethod, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Load all products in one query
      const productIds = items.map(i => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { stock: true },
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products not found or inactive');
      }

      // 2. Validate stock availability & calculate totals
      let total = 0;
      const saleItemsData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        
        // Stock check
        if (!product.stock || parseFloat(product.stock.quantity) < (product.unitType === 'per_kg' ? (item.weightKg || 0) : item.quantity)) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const lineTotal = product.unitType === 'per_kg'
          ? parseFloat(product.pricePerUnit) * (item.weightKg || 0)
          : parseFloat(product.pricePerUnit) * item.quantity;
        
        total += lineTotal;
        
        return { 
          product, 
          item, 
          lineTotal,
          deduction: product.unitType === 'per_kg' ? (item.weightKg || 0) : item.quantity
        };
      });

      // 3. Create sale
      const sale = await tx.sale.create({
        data: {
          employeeId: req.user.id,
          customerId: customerId || null,
          total,
          paymentMethod,
          items: {
            create: saleItemsData.map(({ product, item, lineTotal }) => ({
              productId: item.productId,
              quantity: item.quantity,
              weightKg: item.weightKg,
              unitPrice: product.pricePerUnit,
              lineTotal,
            })),
          },
        },
        include: { 
          items: { include: { product: true } },
          customer: true,
        },
      });

      // 4. Deduct stock for every item
      for (const { product, deduction } of saleItemsData) {
        await tx.stock.update({
          where: { productId: product.id },
          data: { quantity: { decrement: deduction } },
        });
      }

      // 5. Audit log
      await logAudit(tx, {
        employeeId: req.user.id,
        action: 'SALE_COMPLETED',
        entity: 'Sale',
        entityId: sale.id,
        metadata: { total, paymentMethod, itemCount: items.length },
      });

      return sale;
    }, {
      timeout: 30000,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Sale Transaction Error:', err.message);
    if (err.message.includes('Insufficient stock')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Sale could not be completed. Please try again.' });
  }
}

export async function getSaleReceipt(req, res) {
  const { id } = req.params;
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { 
        items: { include: { product: true } },
        employee: { select: { name: true } },
        customer: true,
      },
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
}
