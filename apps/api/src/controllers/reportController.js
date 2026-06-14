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

    // Realtime date and seasonal calculations
    const today = new Date();
    const currentMonth = today.getMonth();
    const dayOfMonth = today.getDate();
    
    // Determine simulated Durban weather variables based on actual current month
    let temp = 25.0;
    let weatherCondition = "Warm & Partly Cloudy";
    
    if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1 || currentMonth === 10) { // Nov, Dec, Jan, Feb (Durban Summer)
      temp = 31.5;
      weatherCondition = "Hot & Sunny";
    } else if (currentMonth >= 4 && currentMonth <= 7) { // May, Jun, Jul, Aug (Durban Winter)
      temp = 20.5;
      weatherCondition = "Cool & Clear";
    } else { // Mar, Apr, Sep, Oct (Spring/Autumn)
      temp = 25.5;
      weatherCondition = "Warm & Partly Cloudy";
    }

    const isPaydayWeek = dayOfMonth >= 25 && dayOfMonth <= 31;

    const predictions = products.map(product => {
      const total30Days = qtyByProduct[product.id] || 0;
      // Average weekly demand (4 weeks in 30 days)
      let avgWeeklyQty = total30Days > 0 ? (total30Days / 4) : (product.pricingType === 'WEIGHT_BASED' ? 45.0 : 35.0);
      avgWeeklyQty = Math.round(avgWeeklyQty * 10) / 10;

      let predictedQty = avgWeeklyQty;
      let reasoningParts = [];

      const catName = product.category.name.toLowerCase();
      const prodName = product.name.toLowerCase();

      // Dynamic seasonal weather demand multipliers
      if (temp >= 28) {
        if (catName.includes('wors') || catName.includes('steak') || prodName.includes('chop')) {
          predictedQty *= 1.25;
          reasoningParts.push(`Braai cuts boosted 25% due to hot Durban summer (${temp}°C)`);
        } else if (catName.includes('soup') || prodName.includes('stew') || prodName.includes('chuck')) {
          predictedQty *= 0.80;
          reasoningParts.push(`Slow-cook stewing cuts reduced 20% due to summer heat (${temp}°C)`);
        }
      } else if (temp <= 22) {
        if (catName.includes('wors') || catName.includes('steak') || prodName.includes('chop')) {
          predictedQty *= 0.85;
          reasoningParts.push(`Braai cuts reduced 15% due to cool winter conditions (${temp}°C)`);
        } else if (catName.includes('soup') || prodName.includes('stew') || prodName.includes('chuck')) {
          predictedQty *= 1.35;
          reasoningParts.push(`Slow-cook stewing cuts boosted 35% due to cool winter (${temp}°C)`);
        }
      }

      // Payday surges
      if (isPaydayWeek) {
        if (prodName.includes('steak') || prodName.includes('t-bone') || prodName.includes('rump')) {
          predictedQty *= 1.30;
          reasoningParts.push("Premium cuts boosted 30% for Payday Week");
        } else {
          predictedQty *= 1.15;
          reasoningParts.push("Standard volume boosted 15% for Payday Week");
        }
      }

      predictedQty = Math.round(predictedQty * 10) / 10;
      const confidence = total30Days > 0 ? 0.95 : 0.65;

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
