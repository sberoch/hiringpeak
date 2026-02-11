import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, like, SQL } from 'drizzle-orm';
import {
  Comment,
  comments,
  Candidate,
  excludePassword,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CommentFindAllServiceParams,
  CreateCommentServiceDto,
  DeleteCommentDto,
  UpdateCommentServiceDto,
} from './comment.dto';

export type CommentApiResponse = Comment & {
  candidate: Candidate;
};

@Injectable()
export class CommentService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CommentFindAllServiceParams,
  ): Promise<PaginatedResponse<CommentApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.comments.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        candidate: true,
        user: true,
      },
    });

    const countQuery = this.db
      .select({ count: count(comments.id) })
      .from(comments)
      .where(whereClause);

    let [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    items = items.map((comment) => {
      comment.user = excludePassword(comment.user);
      return comment;
    });

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const comment = await this.db.query.comments.findFirst({
      where: and(
        eq(comments.id, id),
        eq(comments.organizationId, organizationId),
      ),
    });
    if (!comment) throw new NotFoundException('Not found');
    return comment;
  }

  async create(dto: CreateCommentServiceDto) {
    const [comment] = await this.db.insert(comments).values(dto).returning();
    return comment;
  }

  async update(id: number, dto: UpdateCommentServiceDto) {
    const existingComment = await this.findOne(id, dto.organizationId);
    if (!existingComment) throw new NotFoundException('Not found');

    if (existingComment.userId !== dto.userId) {
      throw new BadRequestException('User ID mismatch');
    }

    const { organizationId, ...updateFields } = dto;
    const [comment] = await this.db
      .update(comments)
      .set(updateFields)
      .where(
        and(eq(comments.id, id), eq(comments.organizationId, organizationId)),
      )
      .returning();
    return comment;
  }

  async remove(
    id: number,
    organizationId: number,
    deleteCommentDto: DeleteCommentDto,
  ) {
    const existingComment = await this.findOne(id, organizationId);
    if (!existingComment) throw new NotFoundException('Not found');

    if (existingComment.userId !== deleteCommentDto.userId) {
      throw new BadRequestException('User ID mismatch');
    }

    const [comment] = await this.db
      .delete(comments)
      .where(
        and(
          eq(comments.id, id),
          eq(comments.organizationId, organizationId),
        ),
      )
      .returning();
    return comment;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CommentFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = comments[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(query: CommentFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(comments.organizationId, query.organizationId));
    if (query.id) {
      filters.push(eq(comments.id, query.id));
    }
    if (query.candidateId) {
      filters.push(eq(comments.candidateId, query.candidateId));
    }
    if (query.comment) {
      filters.push(like(comments.comment, `%${query.comment}%`));
    }
    if (query.userId) {
      filters.push(eq(comments.userId, query.userId));
    }
    return and(...filters);
  }
}
