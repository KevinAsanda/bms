// apps/api/src/controllers/saleController.js
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'EFT']),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().positive().multipleOf(0.001),
    weightKg: z.number().positive().multipleOf(0.001).nullable().optional(),
  })).min(1, 'Sale must have at least one item'),
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
      let totalAmount = 0;
      const saleItemsData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        
        const deductQty = product.pricingType === 'WEIGHT_BASED' ? (item.weightKg || 0) : item.quantity;
        
        // Stock check
        if (!product.stock || parseFloat(product.stock.quantity) < deductQty) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const lineTotal = product.pricingType === 'WEIGHT_BASED'
          ? parseFloat(product.pricePerUnit) * (item.weightKg || 0)
          : parseFloat(product.pricePerUnit) * item.quantity;
        
        totalAmount += lineTotal;
        
        return { 
          product, 
          item, 
          lineTotal,
          deductQty
        };
      });

      // 3. Create sale
      const sale = await tx.sale.create({
        data: {
          employeeId: req.user.id,
          customerId: customerId || null,
          totalAmount,
          paymentMethod,
          items: {
            create: saleItemsData.map(({ product, item, lineTotal }) => ({
              productId: item.productId,
              quantity: item.quantity,
              weightKg: item.weightKg || null,
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
      for (const { product, deductQty } of saleItemsData) {
        await tx.stock.update({
          where: { productId: product.id },
          data: { quantity: { decrement: deductQty } },
        });
      }

      // 5. Audit log
      await logAudit(tx, {
        employeeId: req.user.id,
        action: 'SALE_COMPLETED',
        entityType: 'Sale',
        entityId: sale.id,
        metadata: { totalAmount, paymentMethod, itemCount: items.length },
        ipAddress: req.ip
      });

      return sale;
    }, {
      timeout: 30000,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Sale Transaction Error:', err);
    if (err.message && err.message.includes('Insufficient stock')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Sale could not be completed. Please try again.' });
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
