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
  type Vacancy as VacancyRecord,
} from '@workspace/shared/schemas';
import { contactForViewer } from '@workspace/shared/lib/contact-access';
import type { Company as CompanyResponse } from '@workspace/shared/types/company';
import { CompanyStatusEnum } from '@workspace/shared/types/company';
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

interface CompanyQueryResult extends CompanyRecord {
  vacancies: VacancyRecord[];
  contacts: ContactRecord[];
}


@Injectable()
export class CompanyService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

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
        vacancies: true,
        // A Company lists only its current Contacts.
        contacts: { orderBy: [asc(contacts.name)] },
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

    const parsedItems = items.map((item) =>
      this.transformQueryResult(item, viewerCodes),
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
        vacancies: true,
        // A Company lists only its current Contacts.
        contacts: { orderBy: [asc(contacts.name)] },
      },
    });
    if (!company) throw new NotFoundException('Not found');
    return this.transformQueryResult(company, viewerCodes);
  }

  async create(dto: CreateCompanyServiceDto) {
    const [company] = await this.db
      .insert(companies)
      .values(dto)
      .returning();
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

  async remove(id: number, organizationId: number) {
    const [company] = await this.db
      .delete(companies)
      .where(
        and(eq(companies.id, id), eq(companies.organizationId, organizationId)),
      )
      .returning();
    return company;
  }

  private transformQueryResult(
    result: CompanyQueryResult,
    viewerCodes: readonly string[],
  ): CompanyResponse {
    const { vacancies, contacts: companyContacts, ...rest } = result;
    return {
      ...rest,
      status: this.parseCompanyStatus(rest.status),
      vacancyCount: vacancies.length,
      contacts: companyContacts.map((contact) =>
        contactForViewer(contact, viewerCodes),
      ),
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
      filters.push(eq(companies.status, params.status));
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }

  private parseCompanyStatus(status: string) {
    if (status === CompanyStatusEnum.ACTIVE) {
      return CompanyStatusEnum.ACTIVE;
    }

    if (status === CompanyStatusEnum.PROSPECT) {
      return CompanyStatusEnum.PROSPECT;
    }

    throw new BadRequestException('Invalid company status');
  }
}
