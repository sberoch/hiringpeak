import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { Area, areas } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { AreaQueryParams, CreateAreaDto, UpdateAreaDto } from './area.dto';

@Injectable()
export class AreaService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(params: AreaQueryParams): Promise<PaginatedResponse<Area>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.areas.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(areas.id) })
      .from(areas)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const area = await this.db.query.areas.findFirst({
      where: eq(areas.id, id),
    });
    if (!area) throw new NotFoundException('Not found');
    return area;
  }

  async create(createAreaDto: CreateAreaDto) {
    const [area] = await this.db
      .insert(areas)
      .values(createAreaDto)
      .returning();
    return area;
  }

  async update(id: number, updateAreaDto: UpdateAreaDto) {
    const [area] = await this.db
      .update(areas)
      .set(updateAreaDto)
      .where(eq(areas.id, id))
      .returning();
    return area;
  }

  async remove(id: number) {
    const [area] = await this.db
      .delete(areas)
      .where(eq(areas.id, id))
      .returning();
    return area;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: AreaQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = areas[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: AreaQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
