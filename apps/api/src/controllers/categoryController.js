// apps/api/src/controllers/categoryController.js
import { prisma } from '../utils/prisma.js';
import { z } from 'zod';
import { logAudit } from '../utils/audit.js';

const categorySchema = z.object({
  name: z.string().min(2).max(50),
});

export async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

export async function createCategory(req, res) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const category = await prisma.category.create({
      data: parsed.data,
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category.id,
      metadata: parsed.data,
      ipAddress: req.ip,
    });

    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ errors: parsed.error.flatten() });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: category.id,
      metadata: parsed.data,
      ipAddress: req.ip,
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;
  try {
    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });

    if (category._count.products > 0) {
      return res.status(400).json({ error: 'Cannot delete category that contains products' });
    }

    await prisma.category.delete({ where: { id } });

    await logAudit(prisma, {
      employeeId: req.user.id,
      action: 'CATEGORY_DELETED',
      entityType: 'Category',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
}
