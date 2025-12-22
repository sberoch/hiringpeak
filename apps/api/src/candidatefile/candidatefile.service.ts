import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { CandidateFile, candidateFiles } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CandidateFileQueryParams,
  CreateCandidateFileDto,
  UpdateCandidateFileDto,
} from './candidatefile.dto';

@Injectable()
export class CandidateFileService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CandidateFileQueryParams,
  ): Promise<PaginatedResponse<CandidateFile>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.candidateFiles.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(candidateFiles.id) })
      .from(candidateFiles)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const candidatefile = await this.db.query.candidateFiles.findFirst({
      where: eq(candidateFiles.id, id),
    });
    if (!candidatefile) throw new NotFoundException('Not found');
    return candidatefile;
  }

  async create(createCandidateFileDto: CreateCandidateFileDto) {
    const [candidatefile] = await this.db
      .insert(candidateFiles)
      .values(createCandidateFileDto)
      .returning();
    return candidatefile;
  }

  async update(id: number, updateCandidateFileDto: UpdateCandidateFileDto) {
    const [candidatefile] = await this.db
      .update(candidateFiles)
      .set(updateCandidateFileDto)
      .where(eq(candidateFiles.id, id))
      .returning();
    return candidatefile;
  }

  async remove(id: number) {
    const [candidatefile] = await this.db
      .delete(candidateFiles)
      .where(eq(candidateFiles.id, id))
      .returning();
    return candidatefile;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CandidateFileQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = candidateFiles[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: CandidateFileQueryParams) {
    const filters: SQL[] = [];
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
