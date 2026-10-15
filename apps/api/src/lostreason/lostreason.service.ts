import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { LostReason, lostReasons } from '@workspace/shared/schemas';
import { DEFAULT_LOST_REASONS } from '@workspace/shared/static/commercial-defaults';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';

@Injectable()
export class LostReasonService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /** Every Lost Reason of the Organization, ordered by sort. */
  async findAll(organizationId: number): Promise<LostReason[]> {
    return this.db.query.lostReasons.findMany({
      where: eq(lostReasons.organizationId, organizationId),
      orderBy: [asc(lostReasons.sort), asc(lostReasons.id)],
    });
  }

  async exists(
    id: number,
    organizationId: number,
    options?: DbOptions,
  ): Promise<boolean> {
    const db = options?.tx ?? this.db;
    const reason = await db.query.lostReasons.findFirst({
      columns: { id: true },
      where: and(
        eq(lostReasons.id, id),
        eq(lostReasons.organizationId, organizationId),
      ),
    });
    return reason != null;
  }

  /** Seeds the default Lost Reasons for a new Organization (Onboarding). */
  async createDefaultsForOrganization(
    organizationId: number,
    options?: DbOptions,
  ): Promise<void> {
    const db = options?.tx ?? this.db;
    await db
      .insert(lostReasons)
      .values(
        DEFAULT_LOST_REASONS.map((reason) => ({ ...reason, organizationId })),
      );
  }
}
