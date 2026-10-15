import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNotNull, lte, SQL } from 'drizzle-orm';
import {
  excludePassword,
  tasks,
  type NewTask,
} from '@workspace/shared/schemas';
import type { TaskWithRelations } from '@workspace/shared/types/task';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { NotificationFactory } from '../notification/notification-factory';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateTaskServiceDto,
  TaskFindAllServiceParams,
  UpdateTaskServiceDto,
} from './task.dto';
import {
  attachedToFilters,
  flattenTaskAttachments,
  withTaskAttachments,
  writeTaskAttachments,
} from './task-attachments';

export type TaskApiResponse = TaskWithRelations;

@Injectable()
export class TaskService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  async findAll(
    params: TaskFindAllServiceParams,
  ): Promise<PaginatedResponse<TaskApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.tasks.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        assignedToUser: true,
        createdByUser: true,
        ...withTaskAttachments,
      },
    });

    const countQuery = this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(whereClause);

    const [rows, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    const items = rows.map((t) => ({
      ...flattenTaskAttachments(t),
      assignedToUser: excludePassword(t.assignedToUser),
      createdByUser: excludePassword(t.createdByUser),
    }));

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async dueSoonForUser(
    organizationId: number,
    ownerUserId: number,
    withinDays = 7,
    now: Date = new Date(),
  ) {
    const upper = new Date(now);
    upper.setDate(upper.getDate() + withinDays);
    const upperStr = formatLocalDay(upper);

    const items = await this.db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.assignedTo, ownerUserId),
        eq(tasks.completed, false),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, upperStr),
      ),
      orderBy: [asc(tasks.dueDate)],
      with: {
        assignedToUser: true,
        ...withTaskAttachments,
      },
      limit: 10,
    });

    return items.map((t) => ({
      ...flattenTaskAttachments(t),
      assignedToUser: excludePassword(t.assignedToUser),
    }));
  }

  async openCountFor(organizationId: number, ownerUserId: number) {
    const [{ count: c }] = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, organizationId),
          eq(tasks.assignedTo, ownerUserId),
          eq(tasks.completed, false),
        ),
      );
    return { count: c };
  }

  async create(dto: CreateTaskServiceDto) {
    const task = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(tasks)
        .values({
          title: dto.title,
          dueDate: dto.dueDate ?? null,
          assignedTo: dto.assignedTo,
          createdBy: dto.createdBy,
          organizationId: dto.organizationId,
        } as NewTask)
        .returning();
      await writeTaskAttachments(tx, created.id, dto, { isNew: true });
      return created;
    });

    if (task.assignedTo !== dto.createdBy) {
      await this.notificationFactory.ensure({
        recipientUserId: task.assignedTo,
        organizationId: task.organizationId,
        kind: 'assigned',
        taskId: task.id,
      });
    }

    return task;
  }

  async findOne(id: number, organizationId: number) {
    const task = await this.db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)),
    });
    if (!task) throw new NotFoundException('Not found');
    return task;
  }

  async update(id: number, dto: UpdateTaskServiceDto) {
    const existing = await this.findOne(id, dto.organizationId);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate;
    if (dto.assignedTo !== undefined) updates.assignedTo = dto.assignedTo;

    const task = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(tasks)
        .set(updates)
        .where(
          and(eq(tasks.id, id), eq(tasks.organizationId, dto.organizationId)),
        )
        .returning();
      await writeTaskAttachments(tx, id, dto);
      return updated;
    });

    const reassignedToOther =
      dto.assignedTo !== undefined &&
      dto.assignedTo !== existing.assignedTo &&
      dto.assignedTo !== dto.actorUserId;
    if (reassignedToOther) {
      await this.notificationFactory.ensure({
        recipientUserId: task.assignedTo,
        organizationId: task.organizationId,
        kind: 'assigned',
        taskId: task.id,
      });
    }

    return task;
  }

  async complete(id: number, organizationId: number, completedBy: number) {
    await this.findOne(id, organizationId);
    const set: Record<string, unknown> = {
      completed: true,
      completedAt: new Date(),
      completedBy,
      updatedAt: new Date(),
    };
    const [task] = await this.db
      .update(tasks)
      .set(set)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();
    return task;
  }

  async reopen(id: number, organizationId: number) {
    await this.findOne(id, organizationId);
    const set: Record<string, unknown> = {
      completed: false,
      completedAt: null,
      completedBy: null,
      updatedAt: new Date(),
    };
    const [task] = await this.db
      .update(tasks)
      .set(set)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();
    return task;
  }

  async remove(id: number, organizationId: number) {
    await this.findOne(id, organizationId);
    const [task] = await this.db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();
    return task;
  }

  private buildOrderBy(params: TaskFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || [
      'createdAt',
      'desc',
    ];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const column = (tasks as unknown as Record<string, never>)[sortBy];
    if (!column) {
      throw new BadRequestException('Invalid sortBy parameter');
    }
    return [sortOrder(column)];
  }

  private buildWhereClause(params: TaskFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(tasks.organizationId, params.organizationId));
    if (params.id) filters.push(eq(tasks.id, params.id));
    if (params.assignedTo)
      filters.push(eq(tasks.assignedTo, params.assignedTo));
    if (params.createdBy) filters.push(eq(tasks.createdBy, params.createdBy));
    if (params.completed != null)
      filters.push(eq(tasks.completed, params.completed));
    filters.push(...attachedToFilters(this.db, params));
    return and(...filters);
  }
}

function formatLocalDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
