import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, isNotNull } from 'drizzle-orm';
import {
  LostReason,
  lostReasons,
  opportunities,
} from '@workspace/shared/schemas';
import { DEFAULT_LOST_REASONS } from '@workspace/shared/static/commercial-defaults';
import type {
  CreateLostReasonDto,
  UpdateLostReasonDto,
} from '@workspace/shared/dtos';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import {
  moveTo,
  persistPositions,
  without,
} from '../common/ordered-catalog/ordered-catalog';
import { checkLostReasonRemoval } from './lost-reason-removal';

export type LostReasonWithUsage = LostReason & { opportunityCount: number };

@Injectable()
export class LostReasonService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /** Every Lost Reason of the Organization, ordered by sort. */
  async findAll(
    organizationId: number,
    options?: DbOptions,
  ): Promise<LostReason[]> {
    const db = options?.tx ?? this.db;
    return db.query.lostReasons.findMany({
      where: eq(lostReasons.organizationId, organizationId),
      orderBy: [asc(lostReasons.sort), asc(lostReasons.id)],
    });
  }

  /** Every Lost Reason with how many Opportunities carry it (Settings). */
  async findAllWithUsage(
    organizationId: number,
  ): Promise<LostReasonWithUsage[]> {
    const [reasons, usage] = await Promise.all([
      this.findAll(organizationId),
      this.usageByReason(this.db, organizationId),
    ]);
    return reasons.map((reason) => ({
      ...reason,
      opportunityCount: usage.get(reason.id) ?? 0,
    }));
  }

  async findOne(
    id: number,
    organizationId: number,
    options?: DbOptions,
  ): Promise<LostReason> {
    const db = options?.tx ?? this.db;
    const reason = await db.query.lostReasons.findFirst({
      where: and(
        eq(lostReasons.id, id),
        eq(lostReasons.organizationId, organizationId),
      ),
    });
    if (!reason) throw new NotFoundException('Lost reason not found');
    return reason;
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

  /** Adds a Lost Reason at position `sort` (default last). */
  async create(
    dto: CreateLostReasonDto,
    organizationId: number,
  ): Promise<LostReason> {
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(lostReasons)
        .values({ name: dto.name, sort: 0, organizationId })
        .returning();
      await this.place(tx, organizationId, created.id, dto.sort);
      return this.findOne(created.id, organizationId, { tx });
    });
  }

  /** Renames and/or moves a Lost Reason. */
  async update(
    id: number,
    dto: UpdateLostReasonDto,
    organizationId: number,
  ): Promise<LostReason> {
    return this.db.transaction(async (tx) => {
      await this.findOne(id, organizationId, { tx });
      if (dto.name !== undefined) {
        await tx
          .update(lostReasons)
          .set({ name: dto.name })
          .where(eq(lostReasons.id, id));
      }
      if (dto.sort !== undefined) {
        await this.place(tx, organizationId, id, dto.sort);
      }
      return this.findOne(id, organizationId, { tx });
    });
  }

  /** Deletes an unused Lost Reason; the list is never emptied. */
  async remove(id: number, organizationId: number): Promise<LostReason> {
    return this.db.transaction(async (tx) => {
      const reason = await this.findOne(id, organizationId, { tx });
      const [reasons, usage] = await Promise.all([
        this.findAll(organizationId, { tx }),
        this.usageByReason(tx, organizationId),
      ]);
      const check = checkLostReasonRemoval({
        reasonCount: reasons.length,
        opportunityCount: usage.get(id) ?? 0,
      });
      if ('violation' in check) {
        if (check.violation === 'last_lost_reason') {
          throw new BadRequestException(
            'No se puede eliminar el último motivo de pérdida.',
          );
        }
        const n = check.opportunityCount;
        throw new BadRequestException(
          `No se puede eliminar: el motivo está en uso por ${n} ${
            n === 1 ? 'oportunidad perdida' : 'oportunidades perdidas'
          }.`,
        );
      }
      await tx.delete(lostReasons).where(eq(lostReasons.id, id));
      await persistPositions(tx, lostReasons, reasons, without(reasons, id));
      return reason;
    });
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

  /** Puts reason `id` at `index` (clamped; default last). */
  private async place(
    tx: DrizzleDatabase,
    organizationId: number,
    id: number,
    index?: number,
  ): Promise<void> {
    const reasons = await this.findAll(organizationId, { tx });
    await persistPositions(
      tx,
      lostReasons,
      reasons,
      moveTo(reasons, id, index),
    );
  }

  private async usageByReason(
    db: DrizzleDatabase,
    organizationId: number,
  ): Promise<Map<number, number>> {
    const rows = await db
      .select({ lostReasonId: opportunities.lostReasonId, count: count() })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.organizationId, organizationId),
          isNotNull(opportunities.lostReasonId),
        ),
      )
      .groupBy(opportunities.lostReasonId);
    return new Map(
      rows.map((row) => [row.lostReasonId as number, Number(row.count)]),
    );
  }
}
