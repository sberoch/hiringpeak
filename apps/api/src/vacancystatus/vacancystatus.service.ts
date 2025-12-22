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
  CreateVacancyStatusDto,
  VacancyStatusQueryParams,
  UpdateVacancyStatusDto,
} from './vacancystatus.dto';

@Injectable()
export class VacancyStatusService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: VacancyStatusQueryParams,
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

  async findOne(id: number) {
    const vacancyStatus = await this.db.query.vacancyStatuses.findFirst({
      where: eq(vacancyStatuses.id, id),
    });
    if (!vacancyStatus) throw new NotFoundException('Not found');
    return vacancyStatus;
  }

  async create(createVacancyStatusDto: CreateVacancyStatusDto) {
    const [vacancyStatus] = await this.db
      .insert(vacancyStatuses)
      .values(createVacancyStatusDto)
      .returning();
    return vacancyStatus;
  }

  async update(id: number, updateVacancyStatusDto: UpdateVacancyStatusDto) {
    const [vacancyStatus] = await this.db
      .update(vacancyStatuses)
      .set(updateVacancyStatusDto)
      .where(eq(vacancyStatuses.id, id))
      .returning();
    return vacancyStatus;
  }

  async remove(id: number) {
    const [vacancyStatus] = await this.db
      .delete(vacancyStatuses)
      .where(eq(vacancyStatuses.id, id))
      .returning();
    return vacancyStatus;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: VacancyStatusQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = vacancyStatuses[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: VacancyStatusQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
