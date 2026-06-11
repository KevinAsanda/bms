// apps/api/src/controllers/stockController.js
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

export async function getStock(req, res) {
  try {
    const stock = await prisma.stock.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { product: { name: 'asc' } }
    });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
}

const adjustStockSchema = z.object({
  productId: z.string().cuid(),
  changeQty: z.number(),
  reason: z.enum(['WASTAGE', 'SPOILAGE', 'COUNTING_ERROR', 'DELIVERY', 'OTHER']),
  notes: z.string().optional(),
});

const receiveStockSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    changeQty: z.number().positive(),
  })).min(1),
});

export async function adjustStock(req, res) {
  const parsed = adjustStockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { productId, changeQty, reason, notes } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stock.update({
        where: { productId },
        data: { quantity: { increment: changeQty } },
      });

      await tx.stockAdjustment.create({
        data: {
          productId,
          employeeId: req.user.id,
          changeQty,
          reason,
          notes,
        },
      });

      await logAudit(tx, {
        employeeId: req.user.id,
        action: 'STOCK_ADJUSTED',
        entity: 'Stock',
        entityId: productId,
        metadata: { changeQty, reason },
      });

      return stock;
    }, {
      timeout: 30000,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
}

export async function receiveStock(req, res) {
  const parsed = receiveStockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  const { items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updates = [];
      
      for (const item of items) {
        const stock = await tx.stock.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.changeQty } },
        });

        await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            employeeId: req.user.id,
            changeQty: item.changeQty,
            reason: 'DELIVERY',
          },
        });

        updates.push(stock);
      }

      await logAudit(tx, {
        employeeId: req.user.id,
        action: 'STOCK_RECEIVED',
        entity: 'Stock',
        metadata: { itemCount: items.length },
      });

      return updates;
    }, {
      timeout: 30000,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record delivery' });
  }
}

export async function getAdjustmentHistory(req, res) {
  const { productId } = req.params;
  try {
    const adjustments = await prisma.stockAdjustment.findMany({
      where: productId ? { productId } : undefined,
      include: { 
        product: { select: { name: true } },
        employee: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch adjustment history' });
  }
}
