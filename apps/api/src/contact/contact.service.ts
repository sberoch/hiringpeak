import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  notInArray,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import {
  companies,
  contacts,
  contactSources,
  opportunities,
  opportunityContacts,
  opportunityStages,
  taskContacts,
  tasks,
  users,
  interactionContacts,
  interactions,
  type Contact,
} from '@workspace/shared/schemas';
import { PermissionCode } from '@workspace/shared/enums';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import { contactForViewer } from '@workspace/shared/lib/contact-access';
import {
  defaultFollowUpOwner,
  followUpDueDate,
  followUpTitle,
  nextFollowUp,
} from '@workspace/shared/lib/contact-follow-up';
import type {
  ContactDuplicate,
  ContactFollowUp,
  Contact as ContactFields,
  ContactNetworkFields,
  CreatedContact,
  NetworkContact,
  NetworkContactListItem,
  WrittenContact,
} from '@workspace/shared/types/contact';
import { InteractionService } from '../interaction/interaction.service';
import { findLastInteractions } from '../interaction/last-interactions.query';
import { findCompanyInOrganization } from '../company/company-in-organization';
import { insertProspectCompany } from '../company/prospect-company';
import { releaseContact } from '../common/deletion/deletion-keeps-history';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { AuthzService } from '../auth/authz/authz.service';
import type { CreateTaskServiceDto } from '../task/task.dto';
import { formatLocalDay as localDay, TaskService } from '../task/task.service';
import {
  findLikelyDuplicates,
  type DuplicateProbe,
} from './contact-duplicates';
import { defaultContactOwner, networkFieldViolation } from './contact-policy';
import type {
  ContactActor,
  ContactFindAllServiceParams,
  CreateContactDto,
  UpdateContactDto,
} from './contact.dto';

type NetworkContactFields = ContactFields & ContactNetworkFields;

const NETWORK_WITH = {
  company: { columns: { id: true, name: true } },
  source: { columns: { id: true, name: true } },
  owner: { columns: { id: true, name: true } },
} as const;

@Injectable()
export class ContactService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly authzService: AuthzService,
    private readonly taskService: TaskService,
    private readonly interactionService: InteractionService,
  ) {}

  /** The Organization's network (commercial access only, see controller). */
  async findAll(
    params: ContactFindAllServiceParams,
  ): Promise<PaginatedResponse<NetworkContactListItem>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);

    const itemsQuery = this.db.query.contacts.findMany({
      where: whereClause,
      orderBy: this.buildOrderBy(params),
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: NETWORK_WITH,
    });
    const countQuery = this.db
      .select({ count: count(contacts.id) })
      .from(contacts)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    const contactIds = items.map((item) => item.id);
    const [lastInteractions, openOpportunityCounts] = await Promise.all([
      findLastInteractions(this.db, params.organizationId, { contactIds }),
      this.countOpenOpportunities(contactIds, params.organizationId),
    ]);
    return paginatedResponse(
      await this.withNextFollowUps(
        items.map((item) => ({
          ...this.toNetworkContact(item),
          lastInteraction: lastInteractions.get(item.id) ?? null,
          openOpportunityCount: openOpportunityCounts.get(item.id) ?? 0,
        })),
        params,
      ),
      totalItems,
      paginationQuery,
    );
  }

  /** How many open (neither won nor lost) Opportunities each Contact is in. */
  private async countOpenOpportunities(
    contactIds: number[],
    organizationId: number,
  ): Promise<Map<number, number>> {
    if (contactIds.length === 0) return new Map();
    const rows = await this.db
      .select({
        contactId: opportunityContacts.contactId,
        count: count(opportunityContacts.opportunityId),
      })
      .from(opportunityContacts)
      .innerJoin(
        opportunities,
        eq(opportunities.id, opportunityContacts.opportunityId),
      )
      .innerJoin(
        opportunityStages,
        eq(opportunityStages.id, opportunities.stageId),
      )
      .where(
        and(
          inArray(opportunityContacts.contactId, contactIds),
          eq(opportunities.organizationId, organizationId),
          eq(opportunityStages.isWon, false),
          eq(opportunityStages.isLost, false),
        ),
      )
      .groupBy(opportunityContacts.contactId);
    return new Map(rows.map((row) => [row.contactId, row.count]));
  }

  /**
   * Each Contact with their next follow-up among those the viewer may see
   * (with "Para contactar", among the viewer's own).
   */
  private async withNextFollowUps<T extends NetworkContact>(
    items: T[],
    params: ContactFindAllServiceParams,
  ): Promise<(T & { nextFollowUp: ContactFollowUp | null })[]> {
    if (items.length === 0) return [];
    const rows = await this.db
      .select({
        contactId: taskContacts.contactId,
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        ownerId: users.id,
        ownerName: users.name,
      })
      .from(taskContacts)
      .innerJoin(tasks, eq(tasks.id, taskContacts.taskId))
      .innerJoin(users, eq(users.id, tasks.assignedTo))
      .where(
        and(
          inArray(
            taskContacts.contactId,
            items.map((item) => item.id),
          ),
          this.visibleOpenFollowUp(params),
        ),
      );
    return items.map((item) => {
      const next = nextFollowUp(
        rows.filter((row) => row.contactId === item.id),
      );
      const followUp: ContactFollowUp | null = next && {
        id: next.id,
        title: next.title,
        dueDate: next.dueDate,
        owner: { id: next.ownerId, name: next.ownerName },
      };
      return { ...item, nextFollowUp: followUp };
    });
  }

  /**
   * Open follow-ups the viewer may see: their own without TASK_READ_ALL, and
   * with "Para contactar" (`followUp: 'mine'`).
   */
  private visibleOpenFollowUp(params: ContactFindAllServiceParams): SQL {
    const conditions = [
      eq(tasks.organizationId, params.organizationId),
      eq(tasks.completed, false),
    ];
    if (params.followUp === 'mine' || !params.viewer.readsAllTasks) {
      conditions.push(eq(tasks.assignedTo, params.viewer.userId));
    }
    return and(...conditions)!;
  }

  /** The due date of the Contact's next visible follow-up, for sorting. */
  private nextFollowUpDue(params: ContactFindAllServiceParams) {
    return this.db
      .select({ dueDate: sql`min(${tasks.dueDate})` })
      .from(taskContacts)
      .innerJoin(tasks, eq(tasks.id, taskContacts.taskId))
      .where(
        and(
          eq(taskContacts.contactId, contacts.id),
          this.visibleOpenFollowUp(params),
        ),
      );
  }

  async findOne(id: number, organizationId: number): Promise<NetworkContact> {
    const contact = await this.db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId),
      ),
      with: NETWORK_WITH,
    });
    if (!contact) throw new NotFoundException('Not found');
    return this.toNetworkContact(contact);
  }

  /**
   * Probable duplicates of a Contact about to be created. Callers without
   * commercial access only ever see Contacts that have a Company.
   */
  async findDuplicates(
    probe: DuplicateProbe,
    actor: ContactActor,
  ): Promise<ContactDuplicate[]> {
    const conditions: SQL[] = [
      eq(contacts.organizationId, actor.organizationId),
    ];
    if (!hasCommercialAccess(actor.codes)) {
      conditions.push(isNotNull(contacts.companyId));
    }
    const pool = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        role: contacts.role,
        email: contacts.email,
        linkedin: contacts.linkedin,
        companyId: contacts.companyId,
        companyName: companies.name,
      })
      .from(contacts)
      .leftJoin(companies, eq(companies.id, contacts.companyId))
      .where(and(...conditions));

    return findLikelyDuplicates(probe, pool).map(({ contact, reason }) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      company:
        contact.companyId != null && contact.companyName != null
          ? { id: contact.companyId, name: contact.companyName }
          : null,
      reason,
    }));
  }

  /** Creates the Contact; probable duplicates come back as a warning, never a block. */
  async create(
    dto: CreateContactDto,
    actor: ContactActor,
  ): Promise<CreatedContact> {
    this.assertNoViolation(networkFieldViolation(dto, actor.codes));
    if (
      dto.firstInteraction &&
      !actor.codes.includes(PermissionCode.CRM_MANAGE)
    ) {
      throw new ForbiddenException(
        'Registrar una interacción requiere permisos comerciales.',
      );
    }
    if (dto.companyId != null) {
      await findCompanyInOrganization(
        this.db,
        dto.companyId,
        actor.organizationId,
      );
    }
    await this.assertSourceInOrganization(dto.sourceId, actor.organizationId);

    const ownerId = defaultContactOwner(dto.ownerId, {
      id: actor.userId,
      codes: actor.codes,
    });
    await this.authzService.assertCommercialOwner(
      ownerId,
      actor.organizationId,
    );

    const duplicates = await this.findDuplicates(dto, actor);

    const { newCompanyName, followUpInDays, firstInteraction, ...fields } = dto;
    const values = {
      organizationId: actor.organizationId,
      companyId: fields.companyId ?? null,
      name: dto.name,
      role: dto.role ?? '',
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      linkedin: dto.linkedin ?? null,
      sourceId: dto.sourceId ?? null,
      ownerId,
      shortDescription: dto.shortDescription ?? null,
      createdBy: actor.userId,
    };
    const contact = await this.db.transaction(async (tx) => {
      if (newCompanyName) {
        values.companyId = await insertProspectCompany(
          tx,
          newCompanyName,
          actor.organizationId,
        );
      }
      const [created] = await tx.insert(contacts).values(values).returning();
      // After the Contact, so it is stamped with their Company.
      if (firstInteraction) {
        await this.interactionService.insertInteraction(
          tx,
          { ...firstInteraction, contactIds: [created.id] },
          actor,
        );
      }
      const followUp =
        followUpInDays != null
          ? await this.taskService.insertTask(
              tx,
              this.captureFollowUp(created, followUpInDays, actor),
            )
          : null;
      return { ...created, followUp };
    });
    if (contact.followUp) {
      await this.taskService.notifyNewOwner(contact.followUp, actor.userId);
    }
    return { ...this.forActor(contact, actor), duplicates };
  }

  /**
   * "Abordar en X días": a follow-up Task attached to the new Contact, due
   * today + X, owned by the Contact Owner (see `defaultFollowUpOwner`).
   */
  private captureFollowUp(
    contact: Contact,
    days: number,
    actor: ContactActor,
  ): CreateTaskServiceDto {
    return {
      title: followUpTitle(contact.name),
      dueDate: followUpDueDate(localDay(new Date()), days),
      assignedTo: defaultFollowUpOwner('capture', {
        creatorId: actor.userId,
        contactOwnerId: contact.ownerId,
      }),
      contactIds: [contact.id],
      createdBy: actor.userId,
      organizationId: actor.organizationId,
    };
  }

  /** A plain edit; changing the Company never rewrites past records (ADR 0004). */
  async update(
    id: number,
    dto: UpdateContactDto,
    actor: ContactActor,
  ): Promise<WrittenContact> {
    const existing = await this.findRow(id, actor.organizationId);
    this.assertNoViolation(networkFieldViolation(dto, actor.codes, existing));
    if (dto.companyId != null && dto.companyId !== existing.companyId) {
      await findCompanyInOrganization(
        this.db,
        dto.companyId,
        actor.organizationId,
      );
    }
    await this.assertSourceInOrganization(dto.sourceId, actor.organizationId);
    if (dto.ownerId !== undefined && dto.ownerId !== existing.ownerId) {
      await this.authzService.assertCommercialOwner(
        dto.ownerId,
        actor.organizationId,
      );
    }

    const { newCompanyName, ...fields } = dto;
    const updated = await this.db.transaction(async (tx) => {
      const set: Record<string, unknown> = { ...fields, updatedAt: new Date() };
      if (newCompanyName) {
        set.companyId = await insertProspectCompany(
          tx,
          newCompanyName,
          actor.organizationId,
        );
      }
      const [contact] = await tx
        .update(contacts)
        .set(set as Partial<Contact>)
        .where(
          and(
            eq(contacts.id, id),
            eq(contacts.organizationId, actor.organizationId),
          ),
        )
        .returning();
      return contact;
    });
    return this.forActor(updated, actor);
  }

  /**
   * Deletes the Contact but not the records they were on (see
   * `releaseContact`): their Tasks stay commercial, Vacancies lose them as
   * Vacancy Contact.
   */
  async remove(id: number, actor: ContactActor): Promise<WrittenContact> {
    const existing = await this.findRow(id, actor.organizationId);
    this.assertNoViolation(networkFieldViolation({}, actor.codes, existing));

    const removed = await this.db.transaction(async (tx) => {
      await releaseContact(tx, id);
      const [contact] = await tx
        .delete(contacts)
        .where(
          and(
            eq(contacts.id, id),
            eq(contacts.organizationId, actor.organizationId),
          ),
        )
        .returning();
      return contact;
    });
    return this.forActor(removed, actor);
  }

  private async findRow(id: number, organizationId: number): Promise<Contact> {
    const contact = await this.db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId),
      ),
    });
    if (!contact) throw new NotFoundException('Not found');
    return contact;
  }

  private assertNoViolation(violation: string | null) {
    if (violation) throw new BadRequestException(violation);
  }

  private async assertSourceInOrganization(
    sourceId: number | null | undefined,
    organizationId: number,
  ) {
    if (sourceId == null) return;
    const source = await this.db.query.contactSources.findFirst({
      columns: { id: true },
      where: and(
        eq(contactSources.id, sourceId),
        eq(contactSources.organizationId, organizationId),
      ),
    });
    if (!source) throw new BadRequestException('El origen no existe.');
  }

  /**
   * A written Contact as the caller may see it: the network fields only with
   * commercial access (see contactForViewer).
   */
  private forActor(contact: Contact, actor: ContactActor): WrittenContact {
    if (!hasCommercialAccess(actor.codes)) {
      return contactForViewer(contact, actor.codes);
    }
    return this.toNetworkFields(contact);
  }

  private toNetworkFields(contact: Contact): NetworkContactFields {
    return {
      id: contact.id,
      companyId: contact.companyId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      linkedin: contact.linkedin,
      sourceId: contact.sourceId,
      ownerId: contact.ownerId,
      shortDescription: contact.shortDescription,
    };
  }

  private toNetworkContact(
    row: Contact & {
      company: { id: number; name: string } | null;
      source: { id: number; name: string } | null;
      owner: { id: number; name: string } | null;
    },
  ): NetworkContact {
    return {
      ...this.toNetworkFields(row),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      company: row.company,
      source: row.source,
      owner: row.owner,
    };
  }

  private buildOrderBy(params: ContactFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || [
      'name',
      'asc',
    ];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    if (sortBy === 'followUp') {
      // Contacts without a follow-up (and undated ones) go last.
      const direction = sortOrder === desc ? sql`desc` : sql`asc`;
      return [
        sql`${this.nextFollowUpDue(params)} ${direction} nulls last`,
        asc(contacts.name),
        asc(contacts.id),
      ];
    }
    const column = contacts[sortBy];
    if (column) return [sortOrder(column), asc(contacts.id)];
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: ContactFindAllServiceParams) {
    const filters: SQL[] = [eq(contacts.organizationId, params.organizationId)];

    if (params.search) {
      const pattern = `%${params.search}%`;
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
          ilike(contacts.name, pattern),
          ilike(contacts.email, pattern),
          inArray(contacts.companyId, matchingCompanies),
        )!,
      );
    }

    if (params.ownerId === 'none') filters.push(isNull(contacts.ownerId));
    else if (params.ownerId != null)
      filters.push(eq(contacts.ownerId, params.ownerId));

    if (params.sourceId === 'none') filters.push(isNull(contacts.sourceId));
    else if (params.sourceId != null)
      filters.push(eq(contacts.sourceId, params.sourceId));

    if (params.company === 'with') filters.push(isNotNull(contacts.companyId));
    else if (params.company === 'without')
      filters.push(isNull(contacts.companyId));
    else if (params.company != null)
      filters.push(eq(contacts.companyId, params.company));

    if (params.followUp === 'mine') {
      filters.push(
        inArray(
          contacts.id,
          this.db
            .select({ id: taskContacts.contactId })
            .from(taskContacts)
            .innerJoin(tasks, eq(tasks.id, taskContacts.taskId))
            .where(this.visibleOpenFollowUp(params)),
        ),
      );
    }

    if (params.lastInteractionOlderThan != null) {
      // Older than N days: no Interaction on or after the cutoff day.
      const recentlyInteracted = this.db
        .select({ id: interactionContacts.contactId })
        .from(interactionContacts)
        .innerJoin(
          interactions,
          eq(interactions.id, interactionContacts.interactionId),
        )
        .where(
          gte(
            interactions.date,
            localDayDaysAgo(params.lastInteractionOlderThan),
          ),
        );
      filters.push(notInArray(contacts.id, recentlyInteracted));
    }

    return and(...filters);
  }
}

/** The local `YYYY-MM-DD` day N days before `now`. */
function localDayDaysAgo(days: number, now: Date = new Date()): string {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
