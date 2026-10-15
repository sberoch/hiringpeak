import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import {
  companies,
  contacts,
  type Company as CompanyRecord,
  type Contact as ContactRecord,
} from '@workspace/shared/schemas';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import { contactForViewer } from '@workspace/shared/lib/contact-access';
import { isOpenStage } from '@workspace/shared/lib/opportunity-stage';
import type { Company as CompanyResponse } from '@workspace/shared/types/company';
import type { LastInteraction } from '@workspace/shared/types/interaction';
import { AuthzService } from '../auth/authz/authz.service';
import { releaseCompany } from '../common/deletion/deletion-keeps-history';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CompanyFindAllServiceParams,
  CompanyQueryParams,
  CreateCompanyServiceDto,
  UpdateCompanyServiceDto,
} from './company.dto';
import { findLastInteractions } from '../interaction/last-interactions.query';
import { deriveCompanyStatus } from './company-status';
import { companyStatusCondition } from './company-status-filter';

interface CompanyQueryResult extends CompanyRecord {
  vacancies: { id: number; status: { isFinal: boolean } | null }[];
  contacts: ContactRecord[];
  accountOwner: { id: number; name: string } | null;
  opportunities: {
    id: number;
    estimatedFee: string | null;
    stage: { isWon: boolean; isLost: boolean };
  }[];
}

@Injectable()
export class CompanyService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly authzService: AuthzService,
  ) {}

  /**
   * `viewerCodes` are the caller's permission codes: they decide which Contact
   * fields come back (see contactForViewer).
   */
  async findAll(
    params: CompanyFindAllServiceParams,
    viewerCodes: readonly string[] = [],
  ): Promise<PaginatedResponse<CompanyResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.companies.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        vacancies: {
          columns: { id: true },
          with: { status: { columns: { isFinal: true } } },
        },
        // A Company lists only its current Contacts.
        contacts: { orderBy: [asc(contacts.name)] },
        accountOwner: { columns: { id: true, name: true } },
        opportunities: {
          columns: { id: true, estimatedFee: true },
          with: { stage: { columns: { isWon: true, isLost: true } } },
        },
      },
    });

    const countQuery = this.db
      .select({ count: count(companies.id) })
      .from(companies)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    const lastInteractions = await this.lastInteractionsFor(
      items.map((item) => item.id),
      params.organizationId,
      viewerCodes,
    );
    const parsedItems = items.map((item) =>
      this.transformQueryResult(item, viewerCodes, lastInteractions),
    );

    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  async findOne(
    id: number,
    organizationId: number,
    viewerCodes: readonly string[] = [],
  ): Promise<CompanyResponse> {
    const company = await this.db.query.companies.findFirst({
      where: and(
        eq(companies.id, id),
        eq(companies.organizationId, organizationId),
      ),
      with: {
        vacancies: {
          columns: { id: true },
          with: { status: { columns: { isFinal: true } } },
        },
        // A Company lists only its current Contacts.
        contacts: { orderBy: [asc(contacts.name)] },
        accountOwner: { columns: { id: true, name: true } },
        opportunities: {
          columns: { id: true, estimatedFee: true },
          with: { stage: { columns: { isWon: true, isLost: true } } },
        },
      },
    });
    if (!company) throw new NotFoundException('Not found');
    const lastInteractions = await this.lastInteractionsFor(
      [company.id],
      organizationId,
      viewerCodes,
    );
    return this.transformQueryResult(company, viewerCodes, lastInteractions);
  }

  /**
   * Set or clear the Account Owner (only users with commercial access).
   * Returns the Company plus `accountOwnerChange` (from → to names) for the
   * audit trail.
   */
  async setAccountOwner(
    id: number,
    organizationId: number,
    accountOwnerId: number | null,
  ) {
    const existing = await this.findOne(id, organizationId);
    await this.authzService.assertCommercialOwner(
      accountOwnerId,
      organizationId,
    );
    await this.db
      .update(companies)
      .set({ accountOwnerId } as Partial<CompanyRecord>)
      .where(
        and(eq(companies.id, id), eq(companies.organizationId, organizationId)),
      );
    const updated = await this.findOne(id, organizationId);
    return {
      ...updated,
      accountOwnerChange: {
        from: existing.accountOwner?.name ?? null,
        to: updated.accountOwner?.name ?? null,
      },
    };
  }

  /** Each Company's latest Interaction; only computed for commercial viewers. */
  private async lastInteractionsFor(
    companyIds: number[],
    organizationId: number,
    viewerCodes: readonly string[],
  ): Promise<Map<number, LastInteraction>> {
    if (!hasCommercialAccess(viewerCodes)) return new Map();
    return findLastInteractions(this.db, organizationId, { companyIds });
  }

  async create(dto: CreateCompanyServiceDto) {
    const [company] = await this.db.insert(companies).values(dto).returning();
    return company;
  }

  async update(id: number, dto: UpdateCompanyServiceDto) {
    const { organizationId, ...updateFields } = dto;
    const [company] = await this.db
      .update(companies)
      .set(updateFields)
      .where(
        and(eq(companies.id, id), eq(companies.organizationId, organizationId)),
      )
      .returning();
    return company;
  }

  /**
   * Deletes the Company with its Opportunities and Vacancies, but its people
   * and their history survive it (see `releaseCompany`).
   */
  async remove(id: number, organizationId: number) {
    const where = and(
      eq(companies.id, id),
      eq(companies.organizationId, organizationId),
    );
    const existing = await this.db.query.companies.findFirst({
      columns: { id: true },
      where,
    });
    if (!existing) throw new NotFoundException('Not found');
    return this.db.transaction(async (tx) => {
      await releaseCompany(tx, id);
      const [company] = await tx.delete(companies).where(where).returning();
      return company;
    });
  }

  private transformQueryResult(
    result: CompanyQueryResult,
    viewerCodes: readonly string[],
    lastInteractions: Map<number, LastInteraction>,
  ): CompanyResponse {
    const {
      vacancies,
      contacts: companyContacts,
      opportunities,
      ...rest
    } = result;
    const response: CompanyResponse = {
      ...rest,
      status: deriveCompanyStatus({
        opportunities: opportunities.map((o) => o.stage),
        vacancyCount: vacancies.length,
      }),
      vacancyCount: vacancies.length,
      activeVacancyCount: vacancies.filter((v) => !v.status?.isFinal).length,
      contacts: companyContacts.map((contact) =>
        contactForViewer(contact, viewerCodes),
      ),
    };
    if (!hasCommercialAccess(viewerCodes)) return response;

    const open = opportunities.filter((o) => isOpenStage(o.stage));
    return {
      ...response,
      commercial: {
        openOpportunityCount: open.length,
        openOpportunityFee: open.reduce(
          (sum, o) =>
            sum + (o.estimatedFee == null ? 0 : Number(o.estimatedFee)),
          0,
        ),
        lastInteraction: lastInteractions.get(result.id) ?? null,
      },
    };
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CompanyQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = companies[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: CompanyFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(companies.organizationId, params.organizationId));
    if (params.id) {
      filters.push(eq(companies.id, params.id));
    }
    if (params.name) {
      filters.push(ilike(companies.name, `%${params.name}%`));
    }
    if (params.description) {
      filters.push(ilike(companies.description, params.description));
    }
    if (params.status) {
      filters.push(
        companyStatusCondition(this.db, companies.id, params.status),
      );
    }
    if (params.accountOwnerId != null) {
      filters.push(eq(companies.accountOwnerId, params.accountOwnerId));
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
