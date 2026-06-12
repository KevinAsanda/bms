// apps/api/prisma/seed.js
import 'dotenv/config';
import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

// Force node TLS to allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use the session pooler for seeding
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COST_FACTOR = 12;

async function main() {
  console.log('Seeding database...');

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

  console.log('Admin user created:', admin.email);

  // Add categories
  const categories = ['Beef', 'Chicken', 'Wors', 'Pork', 'Other'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Categories created:', categories.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
