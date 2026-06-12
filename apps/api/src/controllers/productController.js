// apps/api/src/controllers/productController.js
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../utils/audit.js';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  barcode: z.string().min(1),
  categoryId: z.string().cuid(),
  pricePerUnit: z.number().positive(),
  pricingType: z.enum(['FIXED', 'WEIGHT_BASED']),
  unit: z.string().min(1),
});

export async function getProducts(req, res) {
  const { search } = req.query;
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search } },
        ] : undefined,
      },
      include: { category: true, stock: true },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

export async function getProductByBarcode(req, res) {
  const { code } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: code },
      include: { category: true, stock: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

export async function createProduct(req, res) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const product = await prisma.product.create({
      data: {
        ...parsed.data,
        stock: { create: { quantity: 0, lowThreshold: 2 } },
      },
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: parsed.data,
      ipAddress: req.ip
    });

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Barcode already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product.id,
      metadata: { oldPrice: oldProduct.pricePerUnit, newPrice: product.pricePerUnit },
      ipAddress: req.ip
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function archiveProduct(req, res) {
  const { id } = req.params;
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'PRODUCT_ARCHIVED',
      entityType: 'Product',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ message: 'Product archived successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive product' });
  }
}
