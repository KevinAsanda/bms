// apps/api/src/utils/audit.js
import { prisma } from './prisma.js';

export async function logAudit(txOrPrisma, { employeeId, action, entity, entityId, metadata }) {
  const db = txOrPrisma || prisma;
  return db.auditLog.create({
    data: { 
      employeeId, 
      action, 
      entity, 
      entityId: entityId ? String(entityId) : null, 
      metadata 
    },
  });
}
