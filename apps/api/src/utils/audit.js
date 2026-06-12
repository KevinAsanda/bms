// apps/api/src/utils/audit.js
import { prisma } from './prisma.js';

export async function logAudit(txOrPrisma, { employeeId, action, entityType, entityId, metadata, ipAddress = null }) {
  const db = txOrPrisma || prisma;
  return db.auditLog.create({
    data: { 
      employeeId, 
      action, 
      entityType, 
      entityId: String(entityId), 
      metadata: metadata || null,
      ipAddress: ipAddress
    },
  });
}
