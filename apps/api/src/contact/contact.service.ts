import {
  BadRequestException,
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
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  SQL,
} from 'drizzle-orm';
import {
  companies,
  contacts,
  contactSources,
  type Contact,
} from '@workspace/shared/schemas';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import type {
  ContactDuplicate,
  CreatedContact,
  NetworkContact,
} from '@workspace/shared/types/contact';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { UserService } from '../user/user.service';
import {
  findLikelyDuplicates,
  type DuplicateProbe,
} from './contact-duplicates';
import {
  contactOwnerViolation,
  defaultContactOwner,
  networkFieldViolation,
} from './contact-policy';
import type {
  ContactActor,
  ContactFindAllServiceParams,
  CreateContactDto,
  UpdateContactDto,
} from './contact.dto';

const NETWORK_WITH = {
  company: { columns: { id: true, name: true } },
  source: { columns: { id: true, name: true } },
  owner: { columns: { id: true, name: true } },
} as const;

@Injectable()
export class ContactService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly userService: UserService,
  ) {}

  /** The Organization's network (commercial access only, see controller). */
  async findAll(
    params: ContactFindAllServiceParams,
  ): Promise<PaginatedResponse<NetworkContact>> {
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
    return paginatedResponse(
      items.map((item) => this.toNetworkContact(item)),
      totalItems,
      paginationQuery,
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
    if (dto.companyId != null) {
      await this.assertCompanyInOrganization(
        dto.companyId,
        actor.organizationId,
      );
    }
    await this.assertSourceInOrganization(dto.sourceId, actor.organizationId);

    const ownerId = defaultContactOwner(dto.ownerId, {
      id: actor.userId,
      codes: actor.codes,
    });
    await this.assertOwnerAllowed(ownerId, actor.organizationId);

    const duplicates = await this.findDuplicates(dto, actor);

    const values = {
      organizationId: actor.organizationId,
      companyId: dto.companyId ?? null,
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
    const [contact] = await this.db.insert(contacts).values(values).returning();
    return { ...this.toCreated(contact), duplicates };
  }

  /** A plain edit; changing the Company never rewrites past records (ADR 0004). */
  async update(
    id: number,
    dto: UpdateContactDto,
    actor: ContactActor,
  ): Promise<Contact> {
    const existing = await this.findRow(id, actor.organizationId);
    this.assertNoViolation(networkFieldViolation(dto, actor.codes, existing));
    if (dto.companyId != null && dto.companyId !== existing.companyId) {
      await this.assertCompanyInOrganization(
        dto.companyId,
        actor.organizationId,
      );
    }
    await this.assertSourceInOrganization(dto.sourceId, actor.organizationId);
    if (dto.ownerId !== undefined && dto.ownerId !== existing.ownerId) {
      await this.assertOwnerAllowed(dto.ownerId, actor.organizationId);
    }

    const [contact] = await this.db
      .update(contacts)
      .set({ ...dto, updatedAt: new Date() } as Partial<Contact>)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.organizationId, actor.organizationId),
        ),
      )
      .returning();
    return contact;
  }

  /** Vacancies pointing at the Contact lose their Vacancy Contact (FK set null). */
  async remove(id: number, actor: ContactActor): Promise<Contact> {
    const existing = await this.findRow(id, actor.organizationId);
    this.assertNoViolation(networkFieldViolation({}, actor.codes, existing));

    const [contact] = await this.db
      .delete(contacts)
      .where(
        and(
          eq(contacts.id, id),
          eq(contacts.organizationId, actor.organizationId),
        ),
      )
      .returning();
    return contact;
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
    if (!company) throw new BadRequestException('La empresa no existe.');
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

  private async assertOwnerAllowed(
    ownerId: number | null | undefined,
    organizationId: number,
  ) {
    if (ownerId == null) return;
    const commercialUsers =
      await this.userService.findCommercialUsers(organizationId);
    this.assertNoViolation(
      contactOwnerViolation(
        ownerId,
        commercialUsers.map((user) => user.id),
      ),
    );
  }

  private toCreated(contact: Contact): Omit<CreatedContact, 'duplicates'> {
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
      ...this.toCreated(row),
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

    return and(...filters);
  }
}
