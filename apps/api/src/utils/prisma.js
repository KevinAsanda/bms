// apps/api/src/utils/prisma.js
import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Force node TLS to allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let connectionString = process.env.DATABASE_URL;

// Force prisma query engine to accept self-signed certificates
if (connectionString && !connectionString.includes('sslaccept=')) {
  const separator = connectionString.includes('?') ? '&' : '?';
  connectionString = `${connectionString}${separator}sslaccept=accept_invalid_certs`;
  process.env.DATABASE_URL = connectionString;
}

const pool = new pg.Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
