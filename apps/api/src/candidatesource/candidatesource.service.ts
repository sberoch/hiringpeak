import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { CandidateSource, candidateSources } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CandidateSourceQueryParams,
  CreateCandidateSourceServiceDto,
  UpdateCandidateSourceServiceDto,
} from './candidatesource.dto';

@Injectable()
export class CandidateSourceService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CandidateSourceQueryParams,
  ): Promise<PaginatedResponse<CandidateSource>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.candidateSources.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(candidateSources.id) })
      .from(candidateSources)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const candidateSource = await this.db.query.candidateSources.findFirst({
      where: eq(candidateSources.id, id),
    });
    if (!candidateSource) throw new NotFoundException('Not found');
    return candidateSource;
  }

  async create(dto: CreateCandidateSourceServiceDto) {
    const [candidateSource] = await this.db
      .insert(candidateSources)
      .values(dto)
      .returning();
    return candidateSource;
  }

  async update(id: number, dto: UpdateCandidateSourceServiceDto) {
    const { organizationId, ...updateFields } = dto;
    const [candidateSource] = await this.db
      .update(candidateSources)
      .set(updateFields)
      .where(
        and(
          eq(candidateSources.id, id),
          eq(candidateSources.organizationId, organizationId),
        ),
      )
      .returning();
    return candidateSource;
  }

  async remove(id: number) {
    const [candidateSource] = await this.db
      .delete(candidateSources)
      .where(eq(candidateSources.id, id))
      .returning();
    return candidateSource;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CandidateSourceQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = candidateSources[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: CandidateSourceQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
