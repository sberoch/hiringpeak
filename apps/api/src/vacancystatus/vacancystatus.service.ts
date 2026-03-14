import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { vacancyStatuses, VacancyStatus } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateVacancyStatusServiceDto,
  UpdateVacancyStatusServiceDto,
  VacancyStatusFindAllServiceParams,
} from './vacancystatus.dto';

@Injectable()
export class VacancyStatusService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: VacancyStatusFindAllServiceParams,
  ): Promise<PaginatedResponse<VacancyStatus>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.vacancyStatuses.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(vacancyStatuses.id) })
      .from(vacancyStatuses)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const vacancyStatus = await this.db.query.vacancyStatuses.findFirst({
      where: and(
        eq(vacancyStatuses.id, id),
        eq(vacancyStatuses.organizationId, organizationId),
      ),
    });
    if (!vacancyStatus) throw new NotFoundException('Not found');
    return vacancyStatus;
  }

  async create(dto: CreateVacancyStatusServiceDto) {
    const [vacancyStatus] = await this.db
      .insert(vacancyStatuses)
      .values(dto)
      .returning();
    return vacancyStatus;
  }

  async update(id: number, dto: UpdateVacancyStatusServiceDto) {
    const { organizationId, ...updateFields } = dto;
    const [vacancyStatus] = await this.db
      .update(vacancyStatuses)
      .set(updateFields)
      .where(
        and(
          eq(vacancyStatuses.id, id),
          eq(vacancyStatuses.organizationId, organizationId),
        ),
      )
      .returning();
    return vacancyStatus;
  }

  async remove(id: number, organizationId: number) {
    const [vacancyStatus] = await this.db
      .delete(vacancyStatuses)
      .where(
        and(
          eq(vacancyStatuses.id, id),
          eq(vacancyStatuses.organizationId, organizationId),
        ),
      )
      .returning();
    return vacancyStatus;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(
    params: VacancyStatusFindAllServiceParams,
  ): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = vacancyStatuses[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(
    params: VacancyStatusFindAllServiceParams,
  ) {
    const filters: SQL[] = [];
    filters.push(
      eq(vacancyStatuses.organizationId, params.organizationId),
    );
    return and(...filters);
  }
}
