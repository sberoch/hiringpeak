import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { seniorities, Seniority } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateSeniorityServiceDto,
  SeniorityFindAllServiceParams,
  UpdateSeniorityServiceDto,
} from './seniority.dto';

@Injectable()
export class SeniorityService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: SeniorityFindAllServiceParams,
  ): Promise<PaginatedResponse<Seniority>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.seniorities.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(seniorities.id) })
      .from(seniorities)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const seniority = await this.db.query.seniorities.findFirst({
      where: and(
        eq(seniorities.id, id),
        eq(seniorities.organizationId, organizationId),
      ),
    });
    if (!seniority) throw new NotFoundException('Not found');
    return seniority;
  }

  async create(dto: CreateSeniorityServiceDto) {
    const [seniority] = await this.db
      .insert(seniorities)
      .values(dto)
      .returning();
    return seniority;
  }

  async update(id: number, dto: UpdateSeniorityServiceDto) {
    const { organizationId, ...updateFields } = dto;
    const [seniority] = await this.db
      .update(seniorities)
      .set(updateFields)
      .where(
        and(
          eq(seniorities.id, id),
          eq(seniorities.organizationId, organizationId),
        ),
      )
      .returning();
    return seniority;
  }

  async remove(id: number, organizationId: number) {
    const [seniority] = await this.db
      .delete(seniorities)
      .where(
        and(
          eq(seniorities.id, id),
          eq(seniorities.organizationId, organizationId),
        ),
      )
      .returning();
    return seniority;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: SeniorityFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = seniorities[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: SeniorityFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(seniorities.organizationId, params.organizationId));
    return and(...filters);
  }
}
