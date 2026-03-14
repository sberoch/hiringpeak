import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { Area, areas } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  AreaFindAllServiceParams,
  CreateAreaServiceDto,
  UpdateAreaServiceDto,
} from './area.dto';

@Injectable()
export class AreaService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(params: AreaFindAllServiceParams): Promise<PaginatedResponse<Area>> {
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

  async findOne(id: number, organizationId: number) {
    const area = await this.db.query.areas.findFirst({
      where: and(eq(areas.id, id), eq(areas.organizationId, organizationId)),
    });
    if (!area) throw new NotFoundException('Not found');
    return area;
  }

  async create(dto: CreateAreaServiceDto, organizationId: number) {
    const [area] = await this.db
      .insert(areas)
      .values({ ...dto, organizationId })
      .returning();
    return area;
  }

  async update(id: number, dto: UpdateAreaServiceDto, organizationId: number) {
    const [area] = await this.db
      .update(areas)
      .set({ ...dto, organizationId })
      .where(and(eq(areas.id, id), eq(areas.organizationId, organizationId)))
      .returning();
    return area;
  }

  async remove(id: number, organizationId: number) {
    const [area] = await this.db
      .delete(areas)
      .where(and(eq(areas.id, id), eq(areas.organizationId, organizationId)))
      .returning();
    return area;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: AreaFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = areas[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: AreaFindAllServiceParams) {
    const filters: SQL[] = [];

    if (typeof params.organizationId === 'number') {
      filters.push(eq(areas.organizationId, params.organizationId as number));
    }
    if (params.name) {
      filters.push(ilike(areas.name, `%${params.name}%`));
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
