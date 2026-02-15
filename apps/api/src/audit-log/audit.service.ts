import { Inject, Injectable, Logger } from '@nestjs/common';
import { auditEvents } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

export interface RecordAuditEventInput {
  eventType: string;
  organizationId: number;
  actorUserId: number;
  entityType: string;
  entityId?: number | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /**
   * Append an immutable audit event. Fail-open: logs and returns on error
   * so the business operation is not affected.
   */
  async record(input: RecordAuditEventInput): Promise<void> {
    try {
      await this.db.insert(auditEvents).values({
        eventType: input.eventType,
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? null,
      } as typeof auditEvents.$inferInsert);
    } catch (err) {
      this.logger.warn(
        `Audit write failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }
}
