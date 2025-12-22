import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { companies, Company } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CompanyQueryParams,
  CreateCompanyDto,
  UpdateCompanyDto,
} from './company.dto';

@Injectable()
export class CompanyService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CompanyQueryParams,
  ): Promise<PaginatedResponse<Company>> {
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

    const parsedItems = items.map(this.transformQueryResult);

    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const company = await this.db.query.companies.findFirst({
      where: eq(companies.id, id),
    });
    if (!company) throw new NotFoundException('Not found');
    return company;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    const [company] = await this.db
      .insert(companies)
      .values(createCompanyDto)
      .returning();
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    const [company] = await this.db
      .update(companies)
      .set(updateCompanyDto)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async remove(id: number) {
    const [company] = await this.db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  private transformQueryResult(result) {
    const { vacancies, ...rest } = result;
    return {
      ...rest,
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

  private buildWhereClause(params: CompanyQueryParams) {
    const filters: SQL[] = [];
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
}
