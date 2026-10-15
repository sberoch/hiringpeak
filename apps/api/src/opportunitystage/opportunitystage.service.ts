import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { OpportunityStage, opportunityStages } from '@workspace/shared/schemas';
import { DEFAULT_OPPORTUNITY_STAGES } from '@workspace/shared/static/commercial-defaults';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';

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
}
