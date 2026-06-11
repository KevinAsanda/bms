// apps/api/src/controllers/reportController.js
import { prisma } from '../utils/prisma.js';
import { startOfDay, endOfDay, format, startOfMonth } from 'date-fns';

export async function getDailySales(req, res) {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  
  try {
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
      include: { 
        items: { include: { product: true } },
        employee: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = sales.reduce((acc, sale) => {
      const amount = parseFloat(sale.total);
      acc.totalRevenue += amount;
      acc.saleCount += 1;
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + amount;
      return acc;
    }, { totalRevenue: 0, saleCount: 0, CASH: 0, CARD: 0, EFT: 0 });

    res.json({ 
      date: format(targetDate, 'yyyy-MM-dd'), 
      ...summary,
      sales // Include detailed list for the table
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily sales report' });
  }
}

export async function getDashboardStats(req, res) {
  const today = new Date();
  
  try {
    // 1. Today's Revenue & Count
    const todaySales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // 2. Active Employees (logged in today/performing actions)
    const activeEmployeesCount = await prisma.auditLog.groupBy({
      by: ['employeeId'],
      where: {
        createdAt: { gte: startOfDay(today) }
      }
    });

    // 3. Low Stock Items
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: { lte: prisma.stock.fields.lowThreshold }
      },
      include: { product: true },
      take: 5
    });

    // 4. Recent Sales (Last 10)
    const recentSales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { employee: { select: { name: true } } }
    });

    // 5. Monthly Trend (Simple)
    const monthSales = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: startOfMonth(today) }
      },
      _sum: { total: true }
    });

    res.json({
      today: {
        revenue: todaySales._sum.total || 0,
        count: todaySales._count.id,
        activeStaff: activeEmployeesCount.length
      },
      monthRevenue: monthSales._sum.total || 0,
      lowStock: lowStockItems,
      recentSales
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
}

export async function getCategoryPerformance(req, res) {
  const { date } = req.query;
  const targetDate = date ? new Date(date) : new Date();

  try {
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
        },
      },
      include: { product: { include: { category: true } } },
    });

    const categorySales = saleItems.reduce((acc, item) => {
      const catName = item.product.category.name;
      const amount = parseFloat(item.lineTotal);
      if (!acc[catName]) acc[catName] = { name: catName, total: 0, count: 0 };
      acc[catName].total += amount;
      acc[catName].count += 1;
      return acc;
    }, {});

    res.json(Object.values(categorySales).sort((a, b) => b.total - a.total));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category sales' });
  }
}
