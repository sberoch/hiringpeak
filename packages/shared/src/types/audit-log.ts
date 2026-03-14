/**
 * Audit log entry as returned by the list API (with optional actor display info).
 */
export interface AuditLogItem {
  id: number;
  eventType: string;
  organizationId: number;
  actorUserId: number;
  entityType: string;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  /** Optional: actor display name (when joined). */
  actorName?: string;
  /** Optional: actor email (when joined). */
  actorEmail?: string;
}
