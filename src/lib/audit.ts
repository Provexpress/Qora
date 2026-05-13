import { prisma } from "@/lib/prisma";

type AuditInput = {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit({ userId, entityType, entityId, action, summary, metadata }: AuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: userId || null,
      entityType,
      entityId,
      action,
      summary,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}
