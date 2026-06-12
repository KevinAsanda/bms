// apps/api/prisma/seedHistory.js
import 'dotenv/config';
import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { encrypt } from '../src/utils/encryption.js';

// Force node TLS to allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COST_FACTOR = 12;

// Sample Zulu/SA Customer names
const customersData = [
  { name: 'Zama Buthelezi', phone: '0821234567' },
  { name: 'Sipho Zulu', phone: '0837654321' },
  { name: 'Nomalanga Cele', phone: '0719876543' },
  { name: 'Zanele Mthembu', phone: '0723456789' },
  { name: 'Bongani Zuma', phone: '0812345678' },
  { name: 'Thabo Khumalo', phone: '0845678901' },
  { name: 'Nomvula Ndlovu', phone: '0738901234' },
  { name: 'Jabu Dlamini', phone: '0769012345' },
  { name: 'Lindiwe Gumede', phone: '0790123456' },
  { name: 'Mandla Ngcobo', phone: '0829012345' }
];

// Typical butchery product catalog
const productsData = [
  { name: 'T-Bone Steak', barcode: '6001234567890', pricingType: 'WEIGHT_BASED', pricePerUnit: 129.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Beef Mince', barcode: '6001234567891', pricingType: 'WEIGHT_BASED', pricePerUnit: 89.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Rump Steak', barcode: '6001234567892', pricingType: 'WEIGHT_BASED', pricePerUnit: 149.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Beef Stewing', barcode: '6001234567893', pricingType: 'WEIGHT_BASED', pricePerUnit: 79.90, unit: 'kg', categoryName: 'Beef' },
  
  { name: 'Whole Chicken', barcode: '6001234567894', pricingType: 'WEIGHT_BASED', pricePerUnit: 54.90, unit: 'kg', categoryName: 'Chicken' },
  { name: 'Chicken Breasts', barcode: '6001234567895', pricingType: 'WEIGHT_BASED', pricePerUnit: 74.90, unit: 'kg', categoryName: 'Chicken' },
  { name: 'Chicken Wings', barcode: '6001234567896', pricingType: 'WEIGHT_BASED', pricePerUnit: 64.90, unit: 'kg', categoryName: 'Chicken' },
  
  { name: 'Traditional Boerewors', barcode: '6001234567897', pricingType: 'WEIGHT_BASED', pricePerUnit: 98.90, unit: 'kg', categoryName: 'Wors' },
  { name: 'Braai Wors', barcode: '6001234567898', pricingType: 'WEIGHT_BASED', pricePerUnit: 84.90, unit: 'kg', categoryName: 'Wors' },
  { name: 'Cheese Wors', barcode: '6001234567899', pricingType: 'WEIGHT_BASED', pricePerUnit: 109.90, unit: 'kg', categoryName: 'Wors' },
  
  { name: 'Pork Chops', barcode: '6001234567900', pricingType: 'WEIGHT_BASED', pricePerUnit: 84.90, unit: 'kg', categoryName: 'Pork' },
  { name: 'Pork Spare Ribs', barcode: '6001234567901', pricingType: 'WEIGHT_BASED', pricePerUnit: 98.90, unit: 'kg', categoryName: 'Pork' },
  
  { name: 'Braai Charcoal 4kg', barcode: '6001234567902', pricingType: 'FIXED', pricePerUnit: 49.90, unit: 'each', categoryName: 'Other' },
  { name: 'Firelighters 12s', barcode: '6001234567903', pricingType: 'FIXED', pricePerUnit: 24.90, unit: 'each', categoryName: 'Other' },
  { name: 'Butchery Braai Spice', barcode: '6001234567904', pricingType: 'FIXED', pricePerUnit: 34.90, unit: 'each', categoryName: 'Other' },
];

async function main() {
  console.log('--- Starting 3-Month Historical Seeding ---');

  // 1. Seed staff
  console.log('Seeding employees...');
  const passwordHash = await bcrypt.hash('Cashier1234!', COST_FACTOR);
  
  const cashier1 = await prisma.employee.upsert({
    where: { email: 'sipho@bms.local' },
    update: {},
    create: {
      email: 'sipho@bms.local',
      name: 'Sipho Ndlovu',
      passwordHash,
      role: 'CASHIER',
    },
  });

  const cashier2 = await prisma.employee.upsert({
    where: { email: 'nomusa@bms.local' },
    update: {},
    create: {
      email: 'nomusa@bms.local',
      name: 'Nomusa Cele',
      passwordHash,
      role: 'CASHIER',
    },
  });

  const admin = await prisma.employee.findUnique({
    where: { email: 'admin@bms.local' }
  });

  const staffList = [admin, cashier1, cashier2].filter(Boolean);
  console.log(`Staff populated: ${staffList.map(s => s.name).join(', ')}`);

  // 2. Seed customers (with encrypted phone numbers)
  console.log('Seeding customers with POPIA encrypted phone numbers...');
  const customers = [];
  for (const c of customersData) {
    const encryptedPhone = encrypt(c.phone);
    const customer = await prisma.customer.upsert({
      where: { phone: encryptedPhone },
      update: {},
      create: {
        name: c.name,
        phone: encryptedPhone
      }
    });
    customers.push(customer);
  }
  console.log(`Customers populated: ${customers.length}`);

  // 3. Seed products
  console.log('Seeding product catalog...');
  const dbCategories = await prisma.category.findMany();
  const categoryMap = {};
  dbCategories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  const products = [];
  for (const p of productsData) {
    const categoryId = categoryMap[p.categoryName];
    if (!categoryId) {
      console.warn(`Category ${p.categoryName} not found, skipping product ${p.name}`);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {
        pricePerUnit: p.pricePerUnit,
        pricingType: p.pricingType,
        unit: p.unit
      },
      create: {
        name: p.name,
        barcode: p.barcode,
        pricePerUnit: p.pricePerUnit,
        pricingType: p.pricingType,
        unit: p.unit,
        categoryId,
        stock: {
          create: {
            quantity: 500, // starting stock level
            lowThreshold: p.pricingType === 'WEIGHT_BASED' ? 10 : 2
          }
        }
      }
    });
    products.push(product);
  }
  console.log(`Products populated: ${products.length}`);

  // 4. Generate sales history (last 90 days)
  console.log('Generating 3-month sales ledger (daily transaction batches)...');
  
  // Clear any existing transaction ledger to prevent duplicate counts
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  
  const allProducts = await prisma.product.findMany({ include: { stock: true } });
  const stockMap = {};
  allProducts.forEach(prod => {
    stockMap[prod.id] = prod.stock ? parseFloat(prod.stock.quantity.toString()) : 500;
  });

  const today = new Date();
  
  // Outer loop: iterate day by day backwards
  for (let offset = 90; offset >= 0; offset--) {
    const currentDay = new Date();
    currentDay.setDate(today.getDate() - offset);
    
    // Format date string for logging
    const dateStr = currentDay.toISOString().split('T')[0];
    
    // Friday & Saturday are busy; Sunday is closed or light; Weekdays are normal
    const dayOfWeek = currentDay.getDay();
    let txnVolume = 0;
    if (dayOfWeek === 0) { // Sunday (butchery closed or very early close)
      txnVolume = Math.floor(Math.random() * 4); // 0-3 sales
    } else if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday & Saturday
      txnVolume = Math.floor(Math.random() * 20) + 25; // 25-45 sales
    } else { // Weekdays
      txnVolume = Math.floor(Math.random() * 12) + 12; // 12-24 sales
    }

    // Weekly stock delivery (every Tuesday, add stock)
    if (dayOfWeek === 2) {
      const adjustments = [];
      for (const prod of products) {
        const addQty = prod.pricingType === 'WEIGHT_BASED' ? 150 : 25;
        stockMap[prod.id] += addQty;
        adjustments.push({
          productId: prod.id,
          employeeId: staffList[Math.floor(Math.random() * staffList.length)].id,
          changeQty: addQty,
          reason: 'DELIVERY',
          notes: 'Weekly supplier restocking delivery',
          createdAt: currentDay
        });
      }
      if (adjustments.length > 0) {
        await prisma.stockAdjustment.createMany({ data: adjustments });
      }
    }

    // Daily Sales batch insertion
    const salesBatch = [];
    for (let i = 0; i < txnVolume; i++) {
      // Pick random cashier
      const cashier = staffList[Math.floor(Math.random() * staffList.length)];
      
      // 30% chance of customer association
      const associatedCustomer = Math.random() < 0.3 ? customers[Math.floor(Math.random() * customers.length)] : null;
      
      // Payment method distribution
      const randPay = Math.random();
      let paymentMethod = 'CARD';
      if (randPay < 0.35) paymentMethod = 'CASH';
      else if (randPay < 0.40) paymentMethod = 'EFT';

      // Pick 1 to 4 random products for the cart
      const cartItemsCount = Math.floor(Math.random() * 4) + 1;
      const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffledProducts.slice(0, cartItemsCount);
      
      let totalAmount = 0;
      const saleItemsData = [];

      for (const prod of selectedProducts) {
        let qty = 1;
        let weight = null;
        let lineTotal = 0;

        if (prod.pricingType === 'WEIGHT_BASED') {
          // Weight random range from 0.4kg to 2.5kg
          weight = Math.round((Math.random() * 2.1 + 0.4) * 1000) / 1000;
          lineTotal = Math.round(parseFloat(prod.pricePerUnit) * weight * 100) / 100;
        } else {
          qty = Math.floor(Math.random() * 3) + 1; // 1-3 units
          lineTotal = Math.round(parseFloat(prod.pricePerUnit) * qty * 100) / 100;
        }

        totalAmount += lineTotal;
        saleItemsData.push({
          productId: prod.id,
          quantity: qty,
          weightKg: weight,
          unitPrice: prod.pricePerUnit,
          lineTotal: lineTotal
        });

        // Deduct stock in memory
        const deductQty = weight || qty;
        stockMap[prod.id] -= deductQty;
      }

      // Generate random transaction time (between 08:00 AM and 18:00 PM)
      const txnHour = Math.floor(Math.random() * 10) + 8;
      const txnMin = Math.floor(Math.random() * 60);
      const txnSec = Math.floor(Math.random() * 60);
      const txnTime = new Date(currentDay);
      txnTime.setHours(txnHour, txnMin, txnSec);

      salesBatch.push({
        employeeId: cashier.id,
        customerId: associatedCustomer?.id || null,
        totalAmount,
        paymentMethod,
        createdAt: txnTime,
        items: saleItemsData
      });
    }

    // Write all sales of the day sequentially (no transaction block to avoid pool queue timeout)
    if (salesBatch.length > 0) {
      const salesData = [];
      const saleItemsData = [];
      
      for (const sale of salesBatch) {
        const saleId = crypto.randomUUID();
        const receiptRef = 'REC-' + crypto.randomBytes(6).toString('hex').toUpperCase();
        
        salesData.push({
          id: saleId,
          employeeId: sale.employeeId,
          customerId: sale.customerId,
          totalAmount: sale.totalAmount,
          paymentMethod: sale.paymentMethod,
          receiptRef,
          createdAt: sale.createdAt
        });
        
        for (const item of sale.items) {
          saleItemsData.push({
            id: crypto.randomUUID(),
            saleId: saleId,
            productId: item.productId,
            quantity: item.quantity,
            weightKg: item.weightKg,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          });
        }
      }
      
      await prisma.sale.createMany({ data: salesData });
      await prisma.saleItem.createMany({ data: saleItemsData });
    }

    if (offset % 10 === 0) {
      console.log(`-> Seeding progress: completed date ${dateStr} (${offset} days remaining)`);
    }
  }

  console.log('Updating final stock levels in database...');
  for (const prodId of Object.keys(stockMap)) {
    await prisma.stock.upsert({
      where: { productId: prodId },
      update: { quantity: stockMap[prodId] },
      create: { productId: prodId, quantity: stockMap[prodId] }
    });
  }

  console.log('--- Historical Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding crashed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
