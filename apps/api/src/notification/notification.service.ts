import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, SQL } from 'drizzle-orm';
import { notifications, type Notification } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { notOfCommercialTask } from '../task/task-attachments';
import { NotificationFindAllServiceParams } from './notification.dto';

export type NotificationApiResponse = Notification;

/** Who a Notification is for, and whether commercial Tasks reach them. */
export type NotificationRecipient = {
  userId: number;
  commercialAccess: boolean;
};

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

  async unreadCount(organizationId: number, recipient: NotificationRecipient) {
    const [{ count: c }] = await this.db
      .select({ count: count(notifications.id) })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipient.userId),
          isNull(notifications.readAt),
          ...(recipient.commercialAccess
            ? []
            : [notOfCommercialTask(notifications.taskId)]),
        ),
      );
    return { count: c };
  }

  async markRead(
    id: number,
    organizationId: number,
    recipient: NotificationRecipient,
  ) {
    const existing = await this.findOwn(id, organizationId, recipient);
    if (existing.readAt) return existing;
    const readUpdate: Record<string, unknown> = { readAt: new Date() };
    const [updated] = await this.db
      .update(notifications)
      .set(readUpdate)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipient.userId),
        ),
      )
      .returning();
    return updated;
  }

  async dismiss(
    id: number,
    organizationId: number,
    recipient: NotificationRecipient,
  ) {
    await this.findOwn(id, organizationId, recipient);
    const [deleted] = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organizationId, organizationId),
          eq(notifications.recipientUserId, recipient.userId),
        ),
      )
      .returning();
    return deleted;
  }

  /** The recipient's Notification, if it may reach them (see findAll). */
  private async findOwn(
    id: number,
    organizationId: number,
    recipient: NotificationRecipient,
  ) {
    const found = await this.db.query.notifications.findFirst({
      where: and(
        eq(notifications.id, id),
        eq(notifications.organizationId, organizationId),
        eq(notifications.recipientUserId, recipient.userId),
        ...(recipient.commercialAccess
          ? []
          : [notOfCommercialTask(notifications.taskId)]),
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
    if (!params.commercialAccess) {
      filters.push(notOfCommercialTask(notifications.taskId));
    }
    return and(...filters);
  }
}
