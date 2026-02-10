import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { industries, Industry } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateIndustryServiceDto,
  IndustryQueryParams,
  UpdateIndustryServiceDto,
} from './industry.dto';

@Injectable()
export class IndustryService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: IndustryQueryParams,
  ): Promise<PaginatedResponse<Industry>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.industries.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(industries.id) })
      .from(industries)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const industry = await this.db.query.industries.findFirst({
      where: eq(industries.id, id),
    });
    if (!industry) throw new NotFoundException('Not found');
    return industry;
  }

  async create(dto: CreateIndustryServiceDto) {
    const [industry] = await this.db
      .insert(industries)
      .values(dto)
      .returning();
    return industry;
  }

  async update(id: number, dto: UpdateIndustryServiceDto) {
    const { organizationId, ...updateFields } = dto;
    const [industry] = await this.db
      .update(industries)
      .set(updateFields)
      .where(
        and(
          eq(industries.id, id),
          eq(industries.organizationId, organizationId),
        ),
      )
      .returning();
    return industry;
  }

  async remove(id: number) {
    const [industry] = await this.db
      .delete(industries)
      .where(eq(industries.id, id))
      .returning();
    return industry;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: IndustryQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = industries[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: IndustryQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
