import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import {
  companies,
  contacts,
  type Contact,
  interactions,
  NewOpportunity,
  opportunities,
  opportunityContacts,
  taskOpportunities,
  tasks,
  users,
  vacancies,
} from '@workspace/shared/schemas';
import type { OpportunitySortField } from '@workspace/shared/dtos';
import type { SortOrder } from '@workspace/shared/lib/sort-order';
import type { OpportunityNextStep } from '@workspace/shared/types/opportunity';
import { AuthzService } from '../auth/authz/authz.service';
import { companyStatusCondition } from '../company/company-status-filter';
import { findCompanyInOrganization } from '../company/company-in-organization';
import { insertProspectCompany } from '../company/prospect-company';
import { releaseOpportunities } from '../common/deletion/deletion-keeps-history';
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
  CreateOpportunityFromContactDto,
  CreateOpportunityServiceDto,
  CreateVacancyFromOpportunityDto,
  OpportunityFindAllServiceParams,
  UpdateOpportunityServiceDto,
} from './opportunity.dto';
import { planOpportunityFromContact } from './opportunity-from-contact';
import { hasNoNextStep, nextStepOf } from './opportunity-next-step';
import { defaultOpportunityOwner } from './opportunity-owner';
import { editCloseDate, transitionStage } from './opportunity-stage-transition';

const OPPORTUNITY_RELATIONS = {
  company: { columns: { id: true, name: true } },
  stage: true,
  owner: { columns: { id: true, name: true } },
  lostReason: { columns: { id: true, name: true } },
} as const;

const FROM_CONTACT_VIOLATIONS = {
  contact_has_company:
    'El contacto ya tiene empresa: la oportunidad se crea en esa empresa.',
  company_required:
    'Elegí una empresa existente o creá una nueva para el contacto.',
} as const;

@Injectable()
export class OpportunityService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly authzService: AuthzService,
    private readonly stageService: OpportunityStageService,
    private readonly lostReasonService: LostReasonService,
    private readonly vacancyService: VacancyService,
  ) {}

  /**
   * Every matching Opportunity (not paginated: the list is grouped by stage),
   * each with its last Interaction, its next step, its Contacts and how many
   * Vacancies it produced. `noNextStep` keeps only those with No Next Step.
   */
  async findAll(params: OpportunityFindAllServiceParams) {
    const rows = await this.db.query.opportunities.findMany({
      where: this.buildWhereClause(params),
      with: {
        ...OPPORTUNITY_RELATIONS,
        opportunityContacts: {
          with: { contact: { columns: { id: true, name: true } } },
        },
        vacancies: { columns: { id: true } },
      },
      orderBy: buildOrderBy(params.order),
    });
    const recent = await this.findInteractionStamps(
      rows,
      params.organizationId,
    );
    const withNextSteps = await this.withNextSteps(
      rows.map(({ opportunityContacts: links, vacancies: linked, ...row }) => ({
        ...toResponse(row),
        lastInteraction: lastInteractionOfOpportunity(row, recent),
        contacts: links
          .map((link) => link.contact)
          .sort((a, b) => a.name.localeCompare(b.name)),
        vacancyCount: linked.length,
      })),
      params.organizationId,
    );
    return params.noNextStep
      ? withNextSteps.filter((o) => o.noNextStep)
      : withNextSteps;
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
    const [opportunity] = await this.withNextSteps(
      [toResponse(row)],
      organizationId,
    );
    return opportunity;
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
    const [opportunity] = await this.withNextSteps(
      [toResponse(row)],
      organizationId,
    );
    return opportunity;
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

  /**
   * New Opportunities start in the first open stage, owned by the requested
   * owner, else the Company's Account Owner, else the creator.
   */
  async create(dto: CreateOpportunityServiceDto) {
    const { organizationId, createdBy } = dto;
    const company = await findCompanyInOrganization(
      this.db,

      dto.companyId,
      organizationId,
    );
    const ownerId = defaultOpportunityOwner({
      requested: dto.ownerId,
      accountOwnerId: company.accountOwnerId,
      creatorId: createdBy,
    });
    await this.authzService.assertCommercialOwner(ownerId, organizationId);

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

  /**
   * "Crear oportunidad" from a Contact: at the Contact's Company, or at a
   * picked or new Company that becomes the Contact's Company in the same
   * transaction. The Contact is added to the Opportunity. Returns the
   * Opportunity plus the Contact reference for the audit trail.
   */
  async createFromContact(
    contactId: number,
    dto: CreateOpportunityFromContactDto,
    actor: { organizationId: number; createdBy: number },
  ) {
    const { organizationId, createdBy } = actor;
    const contact = await this.db.query.contacts.findFirst({
      columns: { id: true, name: true, companyId: true },
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.organizationId, organizationId),
      ),
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const plan = planOpportunityFromContact(contact, dto);
    if ('violation' in plan) {
      throw new BadRequestException(FROM_CONTACT_VIOLATIONS[plan.violation]);
    }
    // A new Company has no Account Owner yet.
    const accountOwnerId =
      plan.company.kind === 'existing'
        ? (
            await findCompanyInOrganization(
              this.db,

              plan.company.companyId,
              organizationId,
            )
          ).accountOwnerId
        : null;
    const ownerId = defaultOpportunityOwner({
      requested: dto.ownerId,
      accountOwnerId,
      creatorId: createdBy,
    });
    await this.authzService.assertCommercialOwner(ownerId, organizationId);
    const initialStage = await this.stageService.findInitial(organizationId);
    if (!initialStage) {
      throw new BadRequestException(
        'No hay etapas de oportunidad abiertas configuradas.',
      );
    }

    const { company } = plan;
    const opportunityId = await this.db.transaction(async (tx) => {
      const companyId =
        company.kind === 'new'
          ? await insertProspectCompany(tx, company.name, organizationId)
          : company.companyId;

      if (plan.setsContactCompany) {
        // Only if still without a Company: a concurrent edit must not be overwritten.
        const updated = await tx
          .update(contacts)
          .set({ companyId, updatedAt: new Date() } as Partial<Contact>)
          .where(
            and(
              eq(contacts.id, contact.id),
              eq(contacts.organizationId, organizationId),
              isNull(contacts.companyId),
            ),
          )
          .returning({ id: contacts.id });
        if (updated.length === 0) {
          throw new BadRequestException(
            'El contacto cambió de empresa mientras tanto. Volvé a intentarlo.',
          );
        }
      }

      const [created] = await tx
        .insert(opportunities)
        .values({
          title: dto.title,
          companyId,
          estimatedFee: toFeeColumn(dto.estimatedFee),
          ownerId,
          stageId: initialStage.id,
          createdBy,
          organizationId,
        } as NewOpportunity)
        .returning();
      await tx
        .insert(opportunityContacts)
        .values({ opportunityId: created.id, contactId: contact.id });
      return created.id;
    });

    const opportunity = await this.findOne(opportunityId, organizationId);
    return { ...opportunity, contact: { id: contact.id, name: contact.name } };
  }

  /** Edit the facts (title, Company, Estimated Fee, owner). */
  async update(id: number, dto: UpdateOpportunityServiceDto) {
    const { organizationId } = dto;
    await this.findOne(id, organizationId);
    if (dto.companyId !== undefined) {
      await findCompanyInOrganization(this.db, dto.companyId, organizationId);
    }
    if (dto.ownerId !== undefined) {
      await this.authzService.assertCommercialOwner(
        dto.ownerId,
        organizationId,
      );
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

  /**
   * Deletes the Opportunity but not its history: Interactions and Vacancies
   * stay unlinked, Tasks stay commercial (see `releaseOpportunities`).
   */
  async remove(id: number, organizationId: number) {
    const where = and(
      eq(opportunities.id, id),
      eq(opportunities.organizationId, organizationId),
    );
    const existing = await this.db.query.opportunities.findFirst({
      where,
      with: { company: { columns: { id: true, name: true } } },
    });
    if (!existing) throw new NotFoundException('Opportunity not found');
    await this.db.transaction(async (tx) => {
      await releaseOpportunities(tx, [id]);
      await tx.delete(opportunities).where(where);
    });
    return existing;
  }

  /**
   * Adds each Opportunity's next step (the earliest open attached Task, see
   * `nextStepOf`) and whether it has No Next Step. Every open attached Task
   * counts, whoever owns it.
   */
  private async withNextSteps<
    T extends { id: number; stage: { isWon: boolean; isLost: boolean } },
  >(rows: T[], organizationId: number) {
    const ids = rows.map((o) => o.id);
    const openTasks = ids.length
      ? await this.db
          .select({
            opportunityId: taskOpportunities.opportunityId,
            id: tasks.id,
            title: tasks.title,
            dueDate: tasks.dueDate,
            assignedTo: tasks.assignedTo,
            ownerName: users.name,
          })
          .from(taskOpportunities)
          .innerJoin(tasks, eq(tasks.id, taskOpportunities.taskId))
          .innerJoin(users, eq(users.id, tasks.assignedTo))
          .where(
            and(
              inArray(taskOpportunities.opportunityId, ids),
              eq(tasks.organizationId, organizationId),
              eq(tasks.completed, false),
            ),
          )
      : [];

    const byOpportunity = new Map<number, OpportunityNextStep[]>();
    for (const { opportunityId, ownerName, ...task } of openTasks) {
      const list = byOpportunity.get(opportunityId) ?? [];
      list.push({ ...task, owner: { id: task.assignedTo, name: ownerName } });
      byOpportunity.set(opportunityId, list);
    }

    return rows.map((row) => {
      const nextStep = nextStepOf(byOpportunity.get(row.id) ?? []);
      return {
        ...row,
        nextStep,
        noNextStep: hasNoNextStep(row.stage, nextStep),
      };
    });
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
    if (params.companyStatus) {
      filters.push(
        companyStatusCondition(
          this.db,
          opportunities.companyId,
          params.companyStatus,
        ),
      );
    }
    if (params.contactId != null) {
      filters.push(
        inArray(
          opportunities.id,
          this.db
            .select({ id: opportunityContacts.opportunityId })
            .from(opportunityContacts)
            .where(eq(opportunityContacts.contactId, params.contactId)),
        ),
      );
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

/** The column behind each sortable field (see `OPPORTUNITY_SORT_FIELDS`). */
const SORTABLE = {
  closeDate: opportunities.closeDate,
  createdAt: opportunities.createdAt,
} as const satisfies Record<OpportunitySortField, unknown>;

/** Newest first when no order is given. Undated sort last. */
function buildOrderBy(
  order: SortOrder<OpportunitySortField> | undefined,
): SQL[] {
  if (!order) return [desc(opportunities.createdAt), desc(opportunities.id)];
  const column = SORTABLE[order.field];
  const descending = order.direction === 'desc';
  return [
    sql`${column} ${descending ? sql`desc` : sql`asc`} nulls last`,
    desc(opportunities.id),
  ];
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
