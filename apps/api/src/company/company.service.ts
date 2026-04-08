import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import {
  companies,
  type Company as CompanyRecord,
  type Vacancy as VacancyRecord,
} from '@workspace/shared/schemas';
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
}

@Injectable()
export class CompanyService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CompanyFindAllServiceParams,
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

    const parsedItems = items.map((item) => this.transformQueryResult(item));

    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number): Promise<CompanyResponse> {
    const company = await this.db.query.companies.findFirst({
      where: and(
        eq(companies.id, id),
        eq(companies.organizationId, organizationId),
      ),
      with: {
        vacancies: true,
      },
    });
    if (!company) throw new NotFoundException('Not found');
    return this.transformQueryResult(company);
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

  private transformQueryResult(result: CompanyQueryResult): CompanyResponse {
    const { vacancies, ...rest } = result;
    return {
      ...rest,
      status: this.parseCompanyStatus(rest.status),
      vacancyCount: vacancies.length,
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
