import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';
import {
  opportunities,
  OpportunityStage,
  opportunityStages,
} from '@workspace/shared/schemas';
import { DEFAULT_OPPORTUNITY_STAGES } from '@workspace/shared/static/commercial-defaults';
import type {
  CreateOpportunityStageDto,
  SetOpportunityStageOutcomeDto,
  UpdateOpportunityStageDto,
} from '@workspace/shared/dtos';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import {
  BusyStage,
  LayoutResult,
  OutcomeReassignmentViolation,
  placeOpenStage,
  PlacementViolation,
  reassignOutcome,
  removeStage,
  RemovalViolation,
  StageSlot,
  StageUsage,
} from './opportunity-stage-layout';

export type OpportunityStageWithUsage = OpportunityStage & {
  opportunityCount: number;
};

const OUTCOME_LABEL = { won: 'ganada', lost: 'perdida' } as const;

const opportunitiesLabel = (n: number) =>
  `${n} ${n === 1 ? 'oportunidad' : 'oportunidades'}`;

@Injectable()
export class OpportunityStageService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /** Every stage of the Organization, ordered by sort. */
  async findAll(organizationId: number): Promise<OpportunityStage[]> {
    return this.db.query.opportunityStages.findMany({
      where: eq(opportunityStages.organizationId, organizationId),
      orderBy: [asc(opportunityStages.sort), asc(opportunityStages.id)],
    });
  }

  /** Every stage with how many Opportunities sit in it (Settings). */
  async findAllWithUsage(
    organizationId: number,
  ): Promise<OpportunityStageWithUsage[]> {
    const { stages, usage } = await this.loadLayout(this.db, organizationId);
    return stages.map((stage) => ({
      ...stage,
      opportunityCount: usage[stage.id] ?? 0,
    }));
  }

  async findOne(
    id: number,
    organizationId: number,
    options?: DbOptions,
  ): Promise<OpportunityStage> {
    const db = options?.tx ?? this.db;
    const stage = await db.query.opportunityStages.findFirst({
      where: and(
        eq(opportunityStages.id, id),
        eq(opportunityStages.organizationId, organizationId),
      ),
    });
    if (!stage) throw new NotFoundException('Opportunity stage not found');
    return stage;
  }

  /** The first open stage: where every new Opportunity starts. */
  async findInitial(
    organizationId: number,
    options?: DbOptions,
  ): Promise<OpportunityStage | undefined> {
    const db = options?.tx ?? this.db;
    return db.query.opportunityStages.findFirst({
      where: and(
        eq(opportunityStages.organizationId, organizationId),
        eq(opportunityStages.isWon, false),
        eq(opportunityStages.isLost, false),
      ),
      orderBy: [asc(opportunityStages.sort), asc(opportunityStages.id)],
    });
  }

  /** Adds an open stage, by default last among the open stages. */
  async create(
    dto: CreateOpportunityStageDto,
    organizationId: number,
  ): Promise<OpportunityStage> {
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(opportunityStages)
        .values({ name: dto.name, sort: 0, organizationId })
        .returning();
      const { stages } = await this.loadLayout(tx, organizationId);
      await this.apply(
        tx,
        stages,
        placeOpenStage(stages, created.id, dto.sort),
      );
      return this.findOne(created.id, organizationId, { tx });
    });
  }

  /** Renames a stage and/or moves an open one among the open stages. */
  async update(
    id: number,
    dto: UpdateOpportunityStageDto,
    organizationId: number,
  ): Promise<OpportunityStage> {
    return this.db.transaction(async (tx) => {
      await this.findOne(id, organizationId, { tx });
      if (dto.name !== undefined) {
        await tx
          .update(opportunityStages)
          .set({ name: dto.name })
          .where(eq(opportunityStages.id, id));
      }
      if (dto.sort !== undefined) {
        const { stages } = await this.loadLayout(tx, organizationId);
        await this.apply(tx, stages, placeOpenStage(stages, id, dto.sort));
      }
      return this.findOne(id, organizationId, { tx });
    });
  }

  /**
   * Makes the stage the won or lost one. Blocked while the stage giving up the
   * flag or this one holds any Opportunity. Returns the stage plus
   * `outcomeChange` (the outcome and the previous holder) for the audit event.
   */
  async setOutcome(
    id: number,
    dto: SetOpportunityStageOutcomeDto,
    organizationId: number,
  ) {
    return this.db.transaction(async (tx) => {
      await this.findOne(id, organizationId, { tx });
      const { stages, usage } = await this.loadLayout(tx, organizationId);
      const holds = (stage: OpportunityStage) =>
        dto.outcome === 'won' ? stage.isWon : stage.isLost;
      const previous = stages.find(holds);
      await this.apply(
        tx,
        stages,
        reassignOutcome(stages, usage, id, dto.outcome),
      );
      const stage = await this.findOne(id, organizationId, { tx });
      return {
        ...stage,
        outcomeChange: {
          outcome: OUTCOME_LABEL[dto.outcome],
          from: previous?.name ?? null,
        },
      };
    });
  }

  /** Deletes an empty open stage (never won, lost or the last open one). */
  async remove(id: number, organizationId: number): Promise<OpportunityStage> {
    return this.db.transaction(async (tx) => {
      const stage = await this.findOne(id, organizationId, { tx });
      const { stages, usage } = await this.loadLayout(tx, organizationId);
      const result = removeStage(stages, usage, id);
      this.assertOk(result, stages);
      await tx.delete(opportunityStages).where(eq(opportunityStages.id, id));
      await this.persist(tx, stages, result.stages);
      return stage;
    });
  }

  /** Seeds the default stages for a new Organization (Onboarding). */
  async createDefaultsForOrganization(
    organizationId: number,
    options?: DbOptions,
  ): Promise<void> {
    const db = options?.tx ?? this.db;
    await db.insert(opportunityStages).values(
      DEFAULT_OPPORTUNITY_STAGES.map((stage) => ({
        ...stage,
        organizationId,
      })),
    );
  }

  private async loadLayout(
    db: DrizzleDatabase,
    organizationId: number,
  ): Promise<{ stages: OpportunityStage[]; usage: StageUsage }> {
    const [stages, counts] = await Promise.all([
      db.query.opportunityStages.findMany({
        where: eq(opportunityStages.organizationId, organizationId),
        orderBy: [asc(opportunityStages.sort), asc(opportunityStages.id)],
      }),
      db
        .select({ stageId: opportunities.stageId, count: count() })
        .from(opportunities)
        .where(eq(opportunities.organizationId, organizationId))
        .groupBy(opportunities.stageId),
    ]);
    const usage = Object.fromEntries(
      counts.map((row) => [row.stageId, Number(row.count)]),
    );
    return { stages, usage };
  }

  private async apply(
    tx: DrizzleDatabase,
    before: OpportunityStage[],
    result: LayoutResult<
      PlacementViolation | OutcomeReassignmentViolation | RemovalViolation
    >,
  ): Promise<void> {
    this.assertOk(result, before);
    await this.persist(tx, before, result.stages);
  }

  /** Writes the rows whose sort or outcome flags changed. */
  private async persist(
    tx: DrizzleDatabase,
    before: OpportunityStage[],
    after: StageSlot[],
  ): Promise<void> {
    for (const slot of after) {
      const old = before.find((stage) => stage.id === slot.id);
      if (
        old &&
        old.sort === slot.sort &&
        old.isWon === slot.isWon &&
        old.isLost === slot.isLost
      ) {
        continue;
      }
      await tx
        .update(opportunityStages)
        .set({
          sort: slot.sort,
          isWon: slot.isWon,
          isLost: slot.isLost,
        } as Partial<OpportunityStage>)
        .where(eq(opportunityStages.id, slot.id));
    }
  }

  private assertOk<V extends { violation: string }>(
    result: LayoutResult<V>,
    stages: OpportunityStage[],
  ): asserts result is { ok: true; stages: StageSlot[] } {
    if (result.ok) return;
    const nameOf = (id: number) =>
      stages.find((stage) => stage.id === id)?.name ?? `#${id}`;
    const violation = result as unknown as
      | PlacementViolation
      | OutcomeReassignmentViolation
      | RemovalViolation;
    switch (violation.violation) {
      case 'stage_not_found':
        throw new NotFoundException('Opportunity stage not found');
      case 'outcome_stage_pinned':
        throw new BadRequestException(
          'Las etapas ganada y perdida siempre van al final.',
        );
      case 'holds_other_outcome':
        throw new BadRequestException(
          'Una etapa no puede ser ganada y perdida a la vez.',
        );
      case 'outcome_stage':
        throw new BadRequestException(
          'No se puede eliminar la etapa ganada ni la perdida.',
        );
      case 'last_open_stage':
        throw new BadRequestException(
          'Tiene que quedar al menos una etapa abierta.',
        );
      case 'stage_in_use':
        if ('busy' in violation) {
          throw new BadRequestException(
            `No se puede cambiar: ${describeBusy(violation.busy, nameOf)}. Movelas a otra etapa antes.`,
          );
        }
        throw new BadRequestException(
          `No se puede eliminar: hay ${opportunitiesLabel(violation.opportunityCount)} en esta etapa. Movelas a otra etapa antes.`,
        );
    }
  }
}

function describeBusy(
  busy: BusyStage[],
  nameOf: (id: number) => string,
): string {
  return busy
    .map(
      (stage) =>
        `«${nameOf(stage.id)}» tiene ${opportunitiesLabel(stage.opportunityCount)}`,
    )
    .join(' y ');
}
