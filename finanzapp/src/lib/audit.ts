/**
 * Audit logging service — FinanzApp
 * Records security-relevant events for admin panel monitoring.
 */
import prisma from '@/lib/db';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'REGISTER'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'ADMIN_ACTION'
  | 'PROFILE_UPDATE';

/**
 * Log an auditable action to the database.
 * Fails silently to avoid disrupting user flows.
 */
export async function logAudit(
  action: AuditAction,
  userId?: string | null,
  details?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: userId ?? null,
        details: details ?? null,
        ipAddress: ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break user flows
    console.error('[Audit] Failed to log action:', action, error);
  }
}

/**
 * Get paginated audit logs (admin only).
 */
export async function getAuditLogs(options: {
  page?: number;
  pageSize?: number;
  action?: string;
  userId?: string;
}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 25;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (options.action) where.action = options.action;
  if (options.userId) where.userId = options.userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
