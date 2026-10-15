import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ilike, inArray, or, SQL } from 'drizzle-orm';
import {
  companies,
  interactions,
  NewOpportunity,
  opportunities,
  vacancies,
} from '@workspace/shared/schemas';
import { AuthzService } from '../auth/authz/authz.service';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import {
  lastInteractionOfOpportunity,
  type InteractionStamp,
} from '../interaction/last-interaction';
import { LostReasonService } from '../lostreason/lostreason.service';
import { OpportunityStageService } from '../opportunitystage/opportunitystage.service';
import { VacancyService } from '../vacancy/vacancy.service';
import {
  CreateOpportunityServiceDto,
  CreateVacancyFromOpportunityDto,
  OpportunityFindAllServiceParams,
  UpdateOpportunityServiceDto,
} from './opportunity.dto';
import { editCloseDate, transitionStage } from './opportunity-stage-transition';

const OPPORTUNITY_RELATIONS = {
  company: { columns: { id: true, name: true } },
  stage: true,
  owner: { columns: { id: true, name: true } },
  lostReason: { columns: { id: true, name: true } },
} as const;

const OWNER_WITHOUT_COMMERCIAL_ACCESS =
  'El responsable de la oportunidad debe tener acceso al área comercial.';

@Injectable()
export class OpportunityService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly authzService: AuthzService,
    private readonly stageService: OpportunityStageService,
    private readonly lostReasonService: LostReasonService,
    private readonly vacancyService: VacancyService,
  ) {}

  /** Every matching Opportunity (not paginated: the list is grouped by stage). */
  async findAll(params: OpportunityFindAllServiceParams) {
    const rows = await this.db.query.opportunities.findMany({
      where: this.buildWhereClause(params),
      with: OPPORTUNITY_RELATIONS,
      orderBy: [desc(opportunities.createdAt), desc(opportunities.id)],
    });
    const recent = await this.findInteractionStamps(
      rows,
      params.organizationId,
    );
    return rows.map((row) => ({
      ...toResponse(row),
      lastInteraction: lastInteractionOfOpportunity(row, recent),
    }));
  }

  /** Interactions tied to these Opportunities or with their Companies. */
  private async findInteractionStamps(
    rows: { id: number; companyId: number }[],
    organizationId: number,
  ): Promise<InteractionStamp[]> {
    if (rows.length === 0) return [];
    return this.db
      .select({
        id: interactions.id,
        type: interactions.type,
        date: interactions.date,
        opportunityId: interactions.opportunityId,
        companyId: interactions.companyId,
      })
      .from(interactions)
      .where(
        and(
          eq(interactions.organizationId, organizationId),
          or(
            inArray(
              interactions.opportunityId,
              rows.map((row) => row.id),
            ),
            inArray(interactions.companyId, [
              ...new Set(rows.map((row) => row.companyId)),
            ]),
          ),
        ),
      );
  }

  async findOne(id: number, organizationId: number) {
    const row = await this.db.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, id),
        eq(opportunities.organizationId, organizationId),
      ),
      with: OPPORTUNITY_RELATIONS,
    });
    if (!row) throw new NotFoundException('Opportunity not found');
    return toResponse(row);
  }

  /** The Opportunity page: the Opportunity plus the Vacancies linked to it. */
  async findDetail(id: number, organizationId: number) {
    const row = await this.db.query.opportunities.findFirst({
      where: and(
        eq(opportunities.id, id),
        eq(opportunities.organizationId, organizationId),
      ),
      with: {
        ...OPPORTUNITY_RELATIONS,
        vacancies: {
          columns: { id: true, title: true, closedAt: true, createdAt: true },
          orderBy: [asc(vacancies.createdAt), asc(vacancies.id)],
          with: {
            status: { columns: { id: true, name: true, isFinal: true } },
            assignedTo: { columns: { id: true, name: true } },
            vacancyContact: { columns: { id: true, name: true, role: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Opportunity not found');
    return toResponse(row);
  }

  /**
   * "Crear vacante": one Vacancy on the Opportunity's Company, linked back to
   * it. Only a won Opportunity can produce one (VacancyOpportunityPolicy,
   * enforced where the Vacancy is written). Returns the Vacancy plus the
   * Opportunity reference for the audit trail.
   */
  async createVacancy(
    id: number,
    organizationId: number,
    createdBy: number,
    dto: CreateVacancyFromOpportunityDto,
  ) {
    const opportunity = await this.findOne(id, organizationId);
    const vacancy = await this.vacancyService.createFromOpportunity({
      organizationId,
      opportunityId: opportunity.id,
      companyId: opportunity.companyId,
      title: dto.title,
      assignedTo: dto.assignedTo,
      vacancyContactId: dto.vacancyContactId,
      createdBy,
    });
    return {
      ...vacancy,
      opportunity: { id: opportunity.id, title: opportunity.title },
    };
  }

  /** New Opportunities start in the first open stage, owned by the creator unless told otherwise. */
  async create(dto: CreateOpportunityServiceDto) {
    const { organizationId, createdBy } = dto;
    const ownerId = dto.ownerId ?? createdBy;
    await this.assertCompanyInOrganization(dto.companyId, organizationId);
    await this.assertCommercialOwner(ownerId, organizationId);

    const initialStage = await this.stageService.findInitial(organizationId);
    if (!initialStage) {
      throw new BadRequestException(
        'No hay etapas de oportunidad abiertas configuradas.',
      );
    }

    const [created] = await this.db
      .insert(opportunities)
      .values({
        title: dto.title,
        companyId: dto.companyId,
        estimatedFee: toFeeColumn(dto.estimatedFee),
        ownerId,
        stageId: initialStage.id,
        createdBy,
        organizationId,
      } as NewOpportunity)
      .returning();
    return this.findOne(created.id, organizationId);
  }

  /** Edit the facts (title, Company, Estimated Fee, owner). */
  async update(id: number, dto: UpdateOpportunityServiceDto) {
    const { organizationId } = dto;
    await this.findOne(id, organizationId);
    if (dto.companyId !== undefined) {
      await this.assertCompanyInOrganization(dto.companyId, organizationId);
    }
    if (dto.ownerId !== undefined) {
      await this.assertCommercialOwner(dto.ownerId, organizationId);
    }

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.companyId !== undefined) set.companyId = dto.companyId;
    if (dto.ownerId !== undefined) set.ownerId = dto.ownerId;
    if (dto.estimatedFee !== undefined) {
      set.estimatedFee = toFeeColumn(dto.estimatedFee);
    }

    await this.db
      .update(opportunities)
      .set(set as Partial<NewOpportunity>)
      .where(
        and(
          eq(opportunities.id, id),
          eq(opportunities.organizationId, organizationId),
        ),
      );
    return this.findOne(id, organizationId);
  }

  /**
   * Move an Opportunity to another stage through the stage-transition policy.
   * Returns the Opportunity plus `stageChange`, `closeChange` and
   * `lostReasonChange` (from → to labels) for the audit trail.
   */
  async changeStage(
    id: number,
    organizationId: number,
    request: {
      stageId: number;
      lostReasonId?: number | null;
      closeDate?: string | null;
    },
  ) {
    const existing = await this.findOne(id, organizationId);
    const target = await this.stageService.findOne(
      request.stageId,
      organizationId,
    );
    if (
      target.isLost &&
      request.lostReasonId != null &&
      !(await this.lostReasonService.exists(
        request.lostReasonId,
        organizationId,
      ))
    ) {
      throw new NotFoundException('Lost reason not found');
    }

    const result = transitionStage({
      target,
      lostReasonId: request.lostReasonId,
      closeDate: request.closeDate,
      today: todayLocalDay(),
    });
    if (!result.ok) {
      throw new BadRequestException(
        'Para marcar la oportunidad como perdida hace falta un motivo de pérdida.',
      );
    }

    await this.db
      .update(opportunities)
      .set({
        ...result.fields,
        updatedAt: new Date(),
      } as Partial<NewOpportunity>)
      .where(
        and(
          eq(opportunities.id, id),
          eq(opportunities.organizationId, organizationId),
        ),
      );
    const updated = await this.findOne(id, organizationId);
    return {
      ...updated,
      stageChange: { from: existing.stage.name, to: updated.stage.name },
      closeChange: { from: existing.closeDate, to: updated.closeDate },
      lostReasonChange: {
        from: existing.lostReason?.name ?? null,
        to: updated.lostReason?.name ?? null,
      },
    };
  }

  /** Edit the Close Date of a won or lost Opportunity (backdating). */
  async updateCloseDate(id: number, organizationId: number, closeDate: string) {
    const existing = await this.findOne(id, organizationId);
    const result = editCloseDate(existing.stage, closeDate);
    if (!result.ok) {
      throw new BadRequestException(
        'Solo una oportunidad ganada o perdida tiene fecha de cierre.',
      );
    }

    await this.db
      .update(opportunities)
      .set({
        closeDate: result.closeDate,
        updatedAt: new Date(),
      } as Partial<NewOpportunity>)
      .where(
        and(
          eq(opportunities.id, id),
          eq(opportunities.organizationId, organizationId),
        ),
      );
    const updated = await this.findOne(id, organizationId);
    return {
      ...updated,
      closeChange: { from: existing.closeDate, to: updated.closeDate },
    };
  }

  async remove(id: number, organizationId: number) {
    const existing = await this.findOne(id, organizationId);
    await this.db
      .delete(opportunities)
      .where(
        and(
          eq(opportunities.id, id),
          eq(opportunities.organizationId, organizationId),
        ),
      );
    return existing;
  }

  private async assertCompanyInOrganization(
    companyId: number,
    organizationId: number,
  ) {
    const company = await this.db.query.companies.findFirst({
      columns: { id: true },
      where: and(
        eq(companies.id, companyId),
        eq(companies.organizationId, organizationId),
      ),
    });
    if (!company) throw new NotFoundException('Company not found');
  }

  private async assertCommercialOwner(ownerId: number, organizationId: number) {
    if (!(await this.authzService.isCommercialUser(ownerId, organizationId))) {
      throw new BadRequestException(OWNER_WITHOUT_COMMERCIAL_ACCESS);
    }
  }

  private buildWhereClause(params: OpportunityFindAllServiceParams) {
    const filters: SQL[] = [
      eq(opportunities.organizationId, params.organizationId),
    ];
    if (params.ownerId != null) {
      filters.push(eq(opportunities.ownerId, params.ownerId));
    }
    if (params.lostReasonId != null) {
      filters.push(eq(opportunities.lostReasonId, params.lostReasonId));
    }
    if (params.companyId != null) {
      filters.push(eq(opportunities.companyId, params.companyId));
    }
    const search = params.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      const matchingCompanies = this.db
        .select({ id: companies.id })
        .from(companies)
        .where(
          and(
            eq(companies.organizationId, params.organizationId),
            ilike(companies.name, pattern),
          ),
        );
      filters.push(
        or(
          ilike(opportunities.title, pattern),
          inArray(opportunities.companyId, matchingCompanies),
        )!,
      );
    }
    return and(...filters);
  }
}

/** pg returns numeric as a string; the API speaks plain numbers. */
function toResponse<T extends { estimatedFee: string | null }>(row: T) {
  return {
    ...row,
    estimatedFee: row.estimatedFee == null ? null : Number(row.estimatedFee),
  };
}

function toFeeColumn(fee: number | null | undefined): string | null {
  return fee == null ? null : String(fee);
}

/** Today as a local `YYYY-MM-DD` day (same convention as Task due dates). */
function todayLocalDay(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
