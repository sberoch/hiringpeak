import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, SQL } from 'drizzle-orm';
import {
  notifications,
  type Notification,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { NotificationFindAllServiceParams } from './notification.dto';

export type NotificationApiResponse = Notification;

@Injectable()
export class NotificationService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: NotificationFindAllServiceParams,
  ): Promise<PaginatedResponse<NotificationApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.notifications.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        task: {
          columns: {
            id: true,
            title: true,
            completed: true,
            dueDate: true,
          },
        },
      },
    });

    const countQuery = this.db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async unreadCount(organizationId: number, recipientUserId: number) {
    const [{ count: c }] = await this.db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipientUserId),
          isNull(notifications.readAt),
        ),
      );
    return { count: c };
  }

  async markRead(
    id: number,
    organizationId: number,
    recipientUserId: number,
  ) {
    const existing = await this.findOwn(id, organizationId, recipientUserId);
    if (existing.readAt) return existing;
    const readUpdate: Record<string, unknown> = { readAt: new Date() };
    const [updated] = await this.db
      .update(notifications)
      .set(readUpdate)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipientUserId),
        ),
      )
      .returning();
    return updated;
  }

  async dismiss(
    id: number,
    organizationId: number,
    recipientUserId: number,
  ) {
    await this.findOwn(id, organizationId, recipientUserId);
    const [deleted] = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipientUserId),
        ),
      )
      .returning();
    return deleted;
  }

  private async findOwn(
    id: number,
    organizationId: number,
    recipientUserId: number,
  ) {
    const found = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.organizationId, organizationId),
        eq(notifications.recipientUserId, recipientUserId),
      ),
    });
    if (!found) throw new NotFoundException('Not found');
    return found;
  }

  private buildOrderBy(params: NotificationFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || [
      'createdAt',
      'desc',
    ];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const column = (notifications as unknown as Record<string, never>)[sortBy];
    if (!column) {
      throw new BadRequestException('Invalid sortBy parameter');
    }
    return [sortOrder(column)];
  }

  private buildWhereClause(params: NotificationFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(notifications.organizationId, params.organizationId));
    filters.push(eq(notifications.recipientUserId, params.recipientUserId));
    if (params.unreadOnly === true) {
      filters.push(isNull(notifications.readAt));
    }
    return and(...filters);
  }
}
