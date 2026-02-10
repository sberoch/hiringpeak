import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  lt,
  lte,
  not,
  sql,
  SQL,
} from 'drizzle-orm';
import {
  candidateVacancyStatuses,
  CandidateVacancyStatus,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateCandidateVacancyStatusServiceDto,
  CandidateVacancyStatusQueryParams,
  UpdateCandidateVacancyStatusServiceDto,
} from './candidatevacancystatus.dto';

@Injectable()
export class CandidateVacancyStatusService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CandidateVacancyStatusQueryParams,
  ): Promise<PaginatedResponse<CandidateVacancyStatus>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.candidateVacancyStatuses.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(candidateVacancyStatuses.id) })
      .from(candidateVacancyStatuses)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const candidateVacancyStatus =
      await this.db.query.candidateVacancyStatuses.findFirst({
        where: eq(candidateVacancyStatuses.id, id),
      });
    if (!candidateVacancyStatus) throw new NotFoundException('Not found');
    return candidateVacancyStatus;
  }

  async create(dto: CreateCandidateVacancyStatusServiceDto) {
    const sort = dto.sort ?? 0;
    const { organizationId } = dto;

    return await this.db.transaction(async (tx) => {
      await tx
        .update(candidateVacancyStatuses)
        .set({ sort: sql`${candidateVacancyStatuses.sort} + 1` })
        .where(
          and(
            eq(candidateVacancyStatuses.organizationId, organizationId),
            gte(candidateVacancyStatuses.sort, sort),
          ),
        );

      if (dto.isInitial === true) {
        await tx
          .update(candidateVacancyStatuses)
          .set({ isInitial: false })
          .where(
            and(
              eq(candidateVacancyStatuses.organizationId, organizationId),
              eq(candidateVacancyStatuses.isInitial, true),
            ),
          );
      }

      const [candidateVacancyStatus] = await tx
        .insert(candidateVacancyStatuses)
        .values({ ...dto, sort })
        .returning();

      return candidateVacancyStatus;
    });
  }

  async update(id: number, dto: UpdateCandidateVacancyStatusServiceDto) {
    const { organizationId, ...updateFields } = dto;
    return await this.db.transaction(async (tx) => {
      const currentStatus = await this.findOne(id);

      const newSort = dto.sort;

      if (newSort !== undefined && newSort !== currentStatus.sort) {
        if (newSort > currentStatus.sort) {
          await tx
            .update(candidateVacancyStatuses)
            .set({ sort: sql`${candidateVacancyStatuses.sort} - 1` })
            .where(
              and(
                eq(candidateVacancyStatuses.organizationId, organizationId),
                gt(candidateVacancyStatuses.sort, currentStatus.sort),
                lte(candidateVacancyStatuses.sort, newSort),
              ),
            );
        } else if (newSort < currentStatus.sort) {
          await tx
            .update(candidateVacancyStatuses)
            .set({ sort: sql`${candidateVacancyStatuses.sort} + 1` })
            .where(
              and(
                eq(candidateVacancyStatuses.organizationId, organizationId),
                gte(candidateVacancyStatuses.sort, newSort),
                lt(candidateVacancyStatuses.sort, currentStatus.sort),
              ),
            );
        }
      }

      if (dto.isInitial === true) {
        await tx
          .update(candidateVacancyStatuses)
          .set({ isInitial: false })
          .where(
            and(
              eq(candidateVacancyStatuses.organizationId, organizationId),
              not(eq(candidateVacancyStatuses.id, id)),
              eq(candidateVacancyStatuses.isInitial, true),
            ),
          );
      }

      const [updated] = await tx
        .update(candidateVacancyStatuses)
        .set(updateFields)
        .where(
          and(
            eq(candidateVacancyStatuses.id, id),
            eq(candidateVacancyStatuses.organizationId, organizationId),
          ),
        )
        .returning();

      return updated;
    });
  }

  async remove(id: number) {
    return await this.db.transaction(async (tx) => {
      const currentStatus = await this.findOne(id);

      await tx
        .update(candidateVacancyStatuses)
        .set({ sort: sql`${candidateVacancyStatuses.sort} - 1` })
        .where(gt(candidateVacancyStatuses.sort, currentStatus.sort));

      const [deleted] = await tx
        .delete(candidateVacancyStatuses)
        .where(eq(candidateVacancyStatuses.id, id))
        .returning();

      return deleted;
    });
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CandidateVacancyStatusQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = candidateVacancyStatuses[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: CandidateVacancyStatusQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
