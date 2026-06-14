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
      const amount = parseFloat(sale.totalAmount);
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
      _sum: { totalAmount: true },
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
      _sum: { totalAmount: true }
    });

    // 6. Top Product of the day
    const topProductItem = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          }
        }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1
    });

    let topProduct = null;
    if (topProductItem.length > 0) {
      const p = await prisma.product.findUnique({
        where: { id: topProductItem[0].productId }
      });
      topProduct = {
        name: p?.name || 'Unknown',
        quantity: parseFloat(topProductItem[0]._sum.quantity || 0)
      };
    }

    res.json({
      today: {
        revenue: todaySales._sum.totalAmount || 0,
        count: todaySales._count.id,
        activeStaff: activeEmployeesCount.length
      },
      monthRevenue: monthSales._sum.totalAmount || 0,
      lowStock: lowStockItems,
      recentSales,
      topProduct
    });
  } catch (err) {
    console.error(err);
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

export async function getDemandForecast(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true }
    });

    // Fetch sale items over last 30 days
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }
    });

    // Calculate sum of quantities per product
    const qtyByProduct = saleItems.reduce((acc, item) => {
      const pId = item.productId;
      if (!acc[pId]) acc[pId] = 0;
      const qty = item.weightKg ? parseFloat(item.weightKg) : parseFloat(item.quantity);
      acc[pId] += qty;
      return acc;
    }, {});

    // Simulation variables
    const temp = 31.5; // hot weather Durban simulation
    const weatherCondition = "Hot & Sunny";
    const dayOfMonth = new Date().getDate();
    const isPaydayWeek = dayOfMonth >= 22 && dayOfMonth <= 29;

    const predictions = products.map(product => {
      const total30Days = qtyByProduct[product.id] || 0;
      // Average weekly demand (4 weeks in 30 days)
      let avgWeeklyQty = total30Days > 0 ? (total30Days / 4) : (product.pricingType === 'WEIGHT_BASED' ? 45.0 : 35.0);
      avgWeeklyQty = Math.round(avgWeeklyQty * 10) / 10;

      let predictedQty = avgWeeklyQty;
      let reasoningParts = [];

      const catName = product.category.name.toLowerCase();
      if (catName.includes('wors') || catName.includes('steak') || product.name.toLowerCase().includes('chop')) {
        predictedQty *= 1.20;
        reasoningParts.push("Braai cuts boosted 20% due to hot weather (31.5°C)");
      } else if (catName.includes('soup') || product.name.toLowerCase().includes('stew') || product.name.toLowerCase().includes('chuck')) {
        predictedQty *= 0.85;
        reasoningParts.push("Slow-cook cuts reduced 15% due to high temperatures");
      }

      if (isPaydayWeek) {
        if (product.name.toLowerCase().includes('steak') || product.name.toLowerCase().includes('t-bone') || product.name.toLowerCase().includes('rump')) {
          predictedQty *= 1.25;
          reasoningParts.push("Premium cuts boosted 25% for Payday Week");
        } else {
          predictedQty *= 1.10;
          reasoningParts.push("Standard volume boosted 10% for Payday Week");
        }
      }

      predictedQty = Math.round(predictedQty * 10) / 10;
      const confidence = total30Days > 0 ? 0.90 : 0.65;

      return {
        productId: product.id,
        productName: product.name,
        categoryName: product.category.name,
        pricingType: product.pricingType,
        unit: product.unit,
        avgWeeklyQty,
        predictedQty,
        confidence,
        reasoning: reasoningParts.join(". ") || "Standard baseline demand."
      };
    });

    res.json({
      weatherForecast: {
        temp,
        condition: weatherCondition
      },
      isPaydayWeek,
      predictions
    });
  } catch (err) {
    console.error('Forecast Error:', err);
    res.status(500).json({ error: 'Failed to generate demand forecast' });
  }
}
