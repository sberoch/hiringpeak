import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuditLogQueryParamsDto } from '@workspace/shared/dtos';
import type { AuditLogItem } from '@workspace/shared/types/audit-log';
import { auditEvents, users } from '@workspace/shared/schemas';
import type { AnyColumn } from 'drizzle-orm';
import { and, asc, count, desc, eq, gte, lte, SQL } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import type { PaginatedResponse } from '../common/pagination/pagination.params';

export type AuditLogFindAllParams = AuditLogQueryParamsDto & {
  organizationId: number;
};

const VALID_ORDER_COLUMNS = [
  'id',
  'createdAt',
  'eventType',
  'entityType',
  'actorUserId',
] as const;

@Injectable()
export class AuditLogService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: AuditLogFindAllParams,
  ): Promise<PaginatedResponse<AuditLogItem>> {
    const paginationQuery = buildPaginationQuery({
      ...params,
      order: params.order ?? 'createdAt:desc',
    });
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(
      paginationQuery.order as { key: string; direction: string },
    );

    const itemsQuery = this.db
      .select({
        id: auditEvents.id,
        eventType: auditEvents.eventType,
        organizationId: auditEvents.organizationId,
        actorUserId: auditEvents.actorUserId,
        entityType: auditEvents.entityType,
        entityId: auditEvents.entityId,
        metadata: auditEvents.metadata,
        createdAt: auditEvents.createdAt,
        actorName: users.name,
        actorEmail: users.email,
      })
      .from(auditEvents)
      .leftJoin(users, eq(auditEvents.actorUserId, users.id))
      .where(whereClause)
      .orderBy(...orderClause)
      .limit(paginationQuery.limit)
      .offset(paginationQuery.offset);

    const countQuery = this.db
      .select({ count: count(auditEvents.id) })
      .from(auditEvents)
      .where(whereClause);

    const [rows, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    const items: AuditLogItem[] = rows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      organizationId: row.organizationId,
      actorUserId: row.actorUserId,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt.toISOString(),
      actorName: row.actorName ?? undefined,
      actorEmail: row.actorEmail ?? undefined,
    }));

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  private buildWhereClause(params: AuditLogFindAllParams): SQL {
    const conditions: SQL[] = [
      eq(auditEvents.organizationId, params.organizationId),
    ];
    if (params.actorUserId != null) {
      conditions.push(eq(auditEvents.actorUserId, params.actorUserId));
    }
    if (params.entityType) {
      conditions.push(eq(auditEvents.entityType, params.entityType));
    }
    if (params.eventType) {
      conditions.push(eq(auditEvents.eventType, params.eventType));
    }
    if (params.dateFrom) {
      const date = new Date(params.dateFrom);
      if (Number.isNaN(date.getTime()))
        throw new BadRequestException('Invalid dateFrom');
      conditions.push(gte(auditEvents.createdAt, date));
    }
    if (params.dateTo) {
      const date = new Date(params.dateTo);
      if (Number.isNaN(date.getTime()))
        throw new BadRequestException('Invalid dateTo');
      conditions.push(lte(auditEvents.createdAt, date));
    }
    return and(...conditions);
  }

  private buildOrderBy(order: { key: string; direction: string }): SQL[] {
    const col = order.key as (typeof VALID_ORDER_COLUMNS)[number];
    if (!VALID_ORDER_COLUMNS.includes(col)) {
      throw new BadRequestException('Invalid order parameter');
    }
    const columnMap: Record<(typeof VALID_ORDER_COLUMNS)[number], AnyColumn> = {
      id: auditEvents.id,
      createdAt: auditEvents.createdAt,
      eventType: auditEvents.eventType,
      entityType: auditEvents.entityType,
      actorUserId: auditEvents.actorUserId,
    };
    const column = columnMap[col];
    const direction = order.direction?.toLowerCase() === 'desc' ? desc : asc;
    return [direction(column)];
  }
}
