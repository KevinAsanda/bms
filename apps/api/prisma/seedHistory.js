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

// Zulu / SA Customer names
const customersData = [
  { name: 'Sipho Zulu', phone: '0837654321', makeDormant: true },
  { name: 'Zama Buthelezi', phone: '0821234567', makeDormant: true },
  { name: 'Nomalanga Cele', phone: '0719876543', makeDormant: false },
  { name: 'Zanele Mthembu', phone: '0723456789', makeDormant: false },
  { name: 'Bongani Zuma', phone: '0812345678', makeDormant: false },
  { name: 'Thabo Khumalo', phone: '0845678901', makeDormant: false },
  { name: 'Nomvula Ndlovu', phone: '0738901234', makeDormant: false },
  { name: 'Jabu Dlamini', phone: '0769012345', makeDormant: false },
  { name: 'Lindiwe Gumede', phone: '0790123456', makeDormant: false },
  { name: 'Mandla Ngcobo', phone: '0829012345', makeDormant: false }
];

// Butchery product catalog with 4-digit barcodes for weight scanner matches
const productsData = [
  { name: 'Traditional Boerewors', barcode: '1001', pricingType: 'WEIGHT_BASED', pricePerUnit: 98.90, unit: 'kg', categoryName: 'Wors' },
  { name: 'Beef Stewing Chuck', barcode: '1002', pricingType: 'WEIGHT_BASED', pricePerUnit: 79.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Whole Chicken', barcode: '1003', pricingType: 'WEIGHT_BASED', pricePerUnit: 54.90, unit: 'kg', categoryName: 'Chicken' },
  { name: 'T-Bone Steak', barcode: '1004', pricingType: 'WEIGHT_BASED', pricePerUnit: 129.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Pork Chops', barcode: '1005', pricingType: 'WEIGHT_BASED', pricePerUnit: 84.90, unit: 'kg', categoryName: 'Pork' },
  { name: 'Rump Steak', barcode: '1006', pricingType: 'WEIGHT_BASED', pricePerUnit: 149.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Beef Mince', barcode: '1007', pricingType: 'WEIGHT_BASED', pricePerUnit: 89.90, unit: 'kg', categoryName: 'Beef' },
  { name: 'Braai Wors', barcode: '1008', pricingType: 'WEIGHT_BASED', pricePerUnit: 84.90, unit: 'kg', categoryName: 'Wors' },
  { name: 'Pork Spare Ribs', barcode: '1009', pricingType: 'WEIGHT_BASED', pricePerUnit: 98.90, unit: 'kg', categoryName: 'Pork' },
  
  { name: 'Braai Charcoal 4kg', barcode: '2001', pricingType: 'FIXED', pricePerUnit: 49.90, unit: 'each', categoryName: 'Other' },
  { name: 'Firelighters 12s', barcode: '2002', pricingType: 'FIXED', pricePerUnit: 24.90, unit: 'each', categoryName: 'Other' },
  { name: 'Butchery Braai Spice', barcode: '2003', pricingType: 'FIXED', pricePerUnit: 34.90, unit: 'each', categoryName: 'Other' },
];

async function main() {
  console.log('--- STARTING 12-MONTH HISTORICAL DATABASE RESET & SEEDING ---');

  // 1. Database Cleanup (Clear everything except admin)
  console.log('Clearing old transaction data and catalogs...');
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.auditLog.deleteMany({});
  
  // Clear non-admin employees
  await prisma.employee.deleteMany({
    where: { email: { not: 'admin@bms.local' } }
  });

  // Verify/create admin user
  const passwordHash = await bcrypt.hash('Admin1234!', COST_FACTOR);
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@bms.local' },
    update: {},
    create: {
      email: 'admin@bms.local',
      name: 'System Admin',
      passwordHash,
      role: 'OWNER',
    },
  });

  const staffList = [admin];

  // 2. Seed Categories
  console.log('Seeding categories...');
  const categories = ['Beef', 'Chicken', 'Wors', 'Pork', 'Other'];
  const categoryMap = {};
  for (const name of categories) {
    const cat = await prisma.category.create({
      data: { name }
    });
    categoryMap[name] = cat.id;
  }

  // 3. Seed Products
  console.log('Seeding products and initializing stocks...');
  const products = [];
  for (const p of productsData) {
    const categoryId = categoryMap[p.categoryName];
    const product = await prisma.product.create({
      data: {
        name: p.name,
        barcode: p.barcode,
        pricePerUnit: p.pricePerUnit,
        pricingType: p.pricingType,
        unit: p.unit,
        categoryId,
        stock: {
          create: {
            quantity: 800, // starting stock level
            lowThreshold: p.pricingType === 'WEIGHT_BASED' ? 15 : 2
          }
        }
      }
    });
    products.push(product);
  }

  // 4. Seed Customers (Encrypting phone numbers)
  console.log('Seeding customers with POPIA encrypted numbers...');
  const dbCustomers = [];
  for (const c of customersData) {
    const encryptedPhone = encrypt(c.phone);
    const cust = await prisma.customer.create({
      data: {
        name: c.name,
        phone: encryptedPhone
      }
    });
    dbCustomers.push({ ...cust, makeDormant: c.makeDormant });
  }

  // 5. Generate 12 Months of Historical Sales
  console.log('Synthesizing 12-month historical transactions...');
  
  const salesToCreate = [];
  const saleItemsToCreate = [];
  const stockAdjustmentsToCreate = [];
  
  const stockMap = {};
  products.forEach(p => {
    stockMap[p.id] = 800; // Track stock levels in memory
  });

  const today = new Date();
  
  for (let offset = 365; offset >= 0; offset--) {
    const currentDay = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000);
    const month = currentDay.getMonth();
    const dayOfMonth = currentDay.getDate();
    const dayOfWeek = currentDay.getDay();

    // A. Seasonal Weather Simulation for Durban
    let temp = 25.0;
    if (month >= 10 || month <= 1) { // Nov, Dec, Jan, Feb (Durban Summer: Hot)
      temp = Math.round((28 + Math.random() * 5) * 10) / 10;
    } else if (month >= 4 && month <= 7) { // May, Jun, Jul, Aug (Durban Winter: Cool/Mild)
      temp = Math.round((18 + Math.random() * 4) * 10) / 10;
    } else { // Spring / Autumn
      temp = Math.round((23 + Math.random() * 4) * 10) / 10;
    }

    // B. Payday Week Simulation (25th to 31st of the month)
    const isPaydayWeek = dayOfMonth >= 25 && dayOfMonth <= 31;

    // C. Daily Sales Volume (Weekend surge, payday surge)
    let baseSales = 12;
    if (dayOfWeek === 5 || dayOfWeek === 6) baseSales = 28; // Weekend
    if (dayOfWeek === 0) baseSales = 4; // Sunday (Short hours)
    
    if (isPaydayWeek) baseSales = Math.floor(baseSales * 1.5);
    
    const dailyTxnCount = Math.floor(baseSales * (0.85 + Math.random() * 0.3)); // add noise

    // D. Weekly Tuesday Stock Restocking Adjustments
    if (dayOfWeek === 2) {
      for (const prod of products) {
        const addQty = prod.pricingType === 'WEIGHT_BASED' ? 200 : 30;
        stockMap[prod.id] += addQty;
        stockAdjustmentsToCreate.push({
          id: crypto.randomUUID(),
          productId: prod.id,
          employeeId: admin.id,
          changeQty: addQty,
          reason: 'DELIVERY',
          notes: 'Weekly restocking delivery',
          createdAt: currentDay
        });
      }
    }

    // E. Generate individual sales
    for (let s = 0; s < dailyTxnCount; s++) {
      const saleId = crypto.randomUUID();
      const receiptRef = 'REC-' + crypto.randomBytes(6).toString('hex').toUpperCase();

      // Customer association logic
      // Only select customers that aren't marked dormant, OR if we are more than 20 days in the past
      let selectedCustomer = null;
      if (Math.random() < 0.35) {
        const candidates = dbCustomers.filter(c => !c.makeDormant || offset > 22);
        if (candidates.length > 0) {
          selectedCustomer = candidates[Math.floor(Math.random() * candidates.length)];
        }
      }

      // Payment method distribution
      let paymentMethod = 'CARD';
      const randPay = Math.random();
      if (randPay < 0.40) paymentMethod = 'CASH';
      else if (randPay < 0.45) paymentMethod = 'EFT';

      // Pick 1 to 3 products
      const lineCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffled.slice(0, lineCount);

      let totalAmount = 0;

      for (const prod of selectedProducts) {
        let qty = 1;
        let weight = null;
        let lineTotal = 0;

        // Apply realistic seasonal/payday demand multipliers
        let demandMultiplier = 1.0;
        const prodName = prod.name.toLowerCase();
        const catName = prod.categoryName?.toLowerCase() || '';

        // Boerewors & Steaks (Braai products) thrive in summer and weekends
        if (prodName.includes('wors') || prodName.includes('steak')) {
          if (temp >= 28) demandMultiplier *= 1.35; // Hot summer boost
          if (dayOfWeek === 5 || dayOfWeek === 6) demandMultiplier *= 1.4; // Weekend braai
          if (isPaydayWeek) demandMultiplier *= 1.3;
        }

        // Stewing Beef chuck thrives in cool winter
        if (prodName.includes('stewing') || prodName.includes('chuck')) {
          if (temp <= 22) demandMultiplier *= 1.5; // Winter stew boost
          if (temp >= 28) demandMultiplier *= 0.65; // Summer drop
        }

        // Premium cuts see payday surges
        if (prodName.includes('steak') || prodName.includes('t-bone') || prodName.includes('rump')) {
          if (isPaydayWeek) demandMultiplier *= 1.6;
          else demandMultiplier *= 0.8; // mid-month drop
        }

        if (prod.pricingType === 'WEIGHT_BASED') {
          // Weight range between 0.4kg and 2.5kg, scaled by demand multiplier
          const baseWeight = (0.4 + Math.random() * 2.1) * demandMultiplier;
          weight = Math.round(Math.min(Math.max(baseWeight, 0.3), 5.0) * 1000) / 1000;
          lineTotal = Math.round(parseFloat(prod.pricePerUnit) * weight * 100) / 100;
        } else {
          // Fixed units: 1-3 units, scaled by demand
          const baseUnits = Math.round((1 + Math.floor(Math.random() * 3)) * demandMultiplier);
          qty = Math.min(Math.max(baseUnits, 1), 6);
          lineTotal = Math.round(parseFloat(prod.pricePerUnit) * qty * 100) / 100;
        }

        totalAmount += lineTotal;
        
        saleItemsToCreate.push({
          id: crypto.randomUUID(),
          saleId,
          productId: prod.id,
          quantity: qty,
          weightKg: weight,
          unitPrice: prod.pricePerUnit,
          lineTotal
        });

        // Deduct in-memory stock
        stockMap[prod.id] -= (weight || qty);
      }

      // Generate transaction time (between 08:00 AM and 18:00 PM)
      const txnHour = Math.floor(Math.random() * 10) + 8;
      const txnMin = Math.floor(Math.random() * 60);
      const txnSec = Math.floor(Math.random() * 60);
      const txnTime = new Date(currentDay);
      txnTime.setHours(txnHour, txnMin, txnSec);

      salesToCreate.push({
        id: saleId,
        employeeId: admin.id,
        customerId: selectedCustomer?.id || null,
        totalAmount,
        paymentMethod,
        receiptRef,
        createdAt: txnTime
      });
    }
  }

  // 6. Write transaction batches to DB (chunked to prevent payload size limits)
  console.log(`Writing ${salesToCreate.length} sales to database...`);
  const chunkSize = 1000;
  for (let i = 0; i < salesToCreate.length; i += chunkSize) {
    const chunk = salesToCreate.slice(i, i + chunkSize);
    await prisma.sale.createMany({ data: chunk });
  }

  console.log(`Writing ${saleItemsToCreate.length} sale line items to database...`);
  for (let i = 0; i < saleItemsToCreate.length; i += chunkSize) {
    const chunk = saleItemsToCreate.slice(i, i + chunkSize);
    await prisma.saleItem.createMany({ data: chunk });
  }

  if (stockAdjustmentsToCreate.length > 0) {
    console.log(`Writing ${stockAdjustmentsToCreate.length} restocking adjustment records...`);
    for (let i = 0; i < stockAdjustmentsToCreate.length; i += chunkSize) {
      const chunk = stockAdjustmentsToCreate.slice(i, i + chunkSize);
      await prisma.stockAdjustment.createMany({ data: chunk });
    }
  }

  // 7. Update final stock levels in DB
  console.log('Writing final stock balances to database...');
  for (const prodId of Object.keys(stockMap)) {
    // Avoid negative stocks
    const finalStock = Math.max(stockMap[prodId], 12.5);
    await prisma.stock.upsert({
      where: { productId: prodId },
      update: { quantity: finalStock },
      create: { productId: prodId, quantity: finalStock }
    });
  }

  console.log('--- DATABASE SUCCESSFULLY SEEDED WITH 12-MONTH HISTORY ---');
}

main()
  .catch((e) => {
    console.error('Seeding collapsed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
