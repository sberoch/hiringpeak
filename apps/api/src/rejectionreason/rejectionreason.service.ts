import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, gt, gte, lt, lte, sql, SQL } from 'drizzle-orm';
import {
  candidateVacancies,
  RejectionReason,
  rejectionReasons,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  RejectionReasonFindAllServiceParams,
  CreateRejectionReasonServiceDto,
  UpdateRejectionReasonServiceDto,
} from './rejectionreason.dto';

@Injectable()
export class RejectionReasonService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: RejectionReasonFindAllServiceParams,
  ): Promise<PaginatedResponse<RejectionReason>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.rejectionReasons.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(rejectionReasons.id) })
      .from(rejectionReasons)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const rejectionReason = await this.db.query.rejectionReasons.findFirst({
      where: and(
        eq(rejectionReasons.id, id),
        eq(rejectionReasons.organizationId, organizationId),
      ),
    });
    if (!rejectionReason) throw new NotFoundException('Not found');
    return rejectionReason;
  }

  async create(dto: CreateRejectionReasonServiceDto) {
    const sort = dto.sort ?? 0;
    const { organizationId, name } = dto;

    return await this.db.transaction(async (tx) => {
      await tx
        .update(rejectionReasons)
        .set({ sort: sql`${rejectionReasons.sort} + 1` })
        .where(
          and(
            eq(rejectionReasons.organizationId, organizationId),
            gte(rejectionReasons.sort, sort),
          ),
        );

      const [rejectionReason] = await tx
        .insert(rejectionReasons)
        .values({ name, sort, organizationId })
        .returning();

      return rejectionReason;
    });
  }

  async update(id: number, dto: UpdateRejectionReasonServiceDto) {
    const { organizationId, ...updateFields } = dto;
    return await this.db.transaction(async (tx) => {
      const current = await this.findOne(id, organizationId);

      const newSort = dto.sort;
      if (newSort !== undefined && newSort !== current.sort) {
        if (newSort > current.sort) {
          await tx
            .update(rejectionReasons)
            .set({ sort: sql`${rejectionReasons.sort} - 1` })
            .where(
              and(
                eq(rejectionReasons.organizationId, organizationId),
                gt(rejectionReasons.sort, current.sort),
                lte(rejectionReasons.sort, newSort),
              ),
            );
        } else {
          await tx
            .update(rejectionReasons)
            .set({ sort: sql`${rejectionReasons.sort} + 1` })
            .where(
              and(
                eq(rejectionReasons.organizationId, organizationId),
                gte(rejectionReasons.sort, newSort),
                lt(rejectionReasons.sort, current.sort),
              ),
            );
        }
      }

      const [updated] = await tx
        .update(rejectionReasons)
        .set(updateFields)
        .where(
          and(
            eq(rejectionReasons.id, id),
            eq(rejectionReasons.organizationId, organizationId),
          ),
        )
        .returning();

      return updated;
    });
  }

  async remove(id: number, organizationId: number) {
    return await this.db.transaction(async (tx) => {
      const current = await this.findOne(id, organizationId);

      // Guard: a rejection reason in use cannot be deleted — deleting it would
      // strand the rejected Candidacies that point at it (and corrupt the
      // rejection breakdown in the reports). Deliberately stricter than the
      // cascade behaviour of the other per-org taxonomies.
      const [{ count: usageCount }] = await tx
        .select({ count: count(candidateVacancies.id) })
        .from(candidateVacancies)
        .where(eq(candidateVacancies.rejectionReasonId, id));

      if (usageCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar: el motivo está en uso por ${usageCount} ${
            usageCount === 1 ? 'candidatura' : 'candidaturas'
          }.`,
        );
      }

      // Guard: the list can never be emptied, so the required pick when
      // rejecting a Candidacy is always satisfiable.
      const [{ count: totalCount }] = await tx
        .select({ count: count(rejectionReasons.id) })
        .from(rejectionReasons)
        .where(eq(rejectionReasons.organizationId, organizationId));

      if (totalCount <= 1) {
        throw new BadRequestException(
          'No se puede eliminar el último motivo de rechazo.',
        );
      }

      await tx
        .update(rejectionReasons)
        .set({ sort: sql`${rejectionReasons.sort} - 1` })
        .where(
          and(
            eq(rejectionReasons.organizationId, organizationId),
            gt(rejectionReasons.sort, current.sort),
          ),
        );

      const [deleted] = await tx
        .delete(rejectionReasons)
        .where(
          and(
            eq(rejectionReasons.id, id),
            eq(rejectionReasons.organizationId, organizationId),
          ),
        )
        .returning();

      return deleted;
    });
  }

  private buildOrderBy(params: RejectionReasonFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const column = rejectionReasons[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: RejectionReasonFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(rejectionReasons.organizationId, params.organizationId));
    return and(...filters);
  }
}
