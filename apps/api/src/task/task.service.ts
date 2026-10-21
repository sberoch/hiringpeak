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
  isNotNull,
  lt,
  lte,
  SQL,
} from 'drizzle-orm';
import {
  excludePassword,
  tasks,
  type NewTask,
  type Task,
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
  attachmentClassFilters,
  flattenTaskAttachments,
  withTaskAttachments,
  writeTaskAttachments,
} from './task-attachments';
import { isCommercialTask } from './task-access';

export type TaskApiResponse = TaskWithRelations;

/** The User a Task query is for, and whether commercial Tasks reach them. */
export type TaskViewer = { userId: number; commercialAccess: boolean };

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
        ...withTaskAttachments(params.organizationId),
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
    owner: TaskViewer,
    withinDays = 7,
    now: Date = new Date(),
  ) {
    const upper = new Date(now);
    upper.setDate(upper.getDate() + withinDays);
    const upperStr = formatLocalDay(upper);

    const items = await this.db.query.tasks.findMany({
      where: and(
        eq(tasks.organizationId, organizationId),
        eq(tasks.assignedTo, owner.userId),
        eq(tasks.completed, false),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, upperStr),
        ...attachmentClassFilters(owner),
      ),
      orderBy: [asc(tasks.dueDate)],
      with: {
        assignedToUser: true,
        ...withTaskAttachments(organizationId),
      },
      limit: 10,
    });

    return items.map((t) => ({
      ...flattenTaskAttachments(t),
      assignedToUser: excludePassword(t.assignedToUser),
    }));
  }

  async openCountFor(organizationId: number, owner: TaskViewer) {
    const [{ count: c }] = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, organizationId),
          eq(tasks.assignedTo, owner.userId),
          eq(tasks.completed, false),
          ...attachmentClassFilters(owner),
        ),
      );
    return { count: c };
  }

  /** The User's own open Tasks whose Due Date is before today (local day). */
  async overdueCountFor(
    organizationId: number,
    owner: TaskViewer,
    now: Date = new Date(),
  ) {
    const [{ count: c }] = await this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(
        and(
          eq(tasks.organizationId, organizationId),
          eq(tasks.assignedTo, owner.userId),
          eq(tasks.completed, false),
          lt(tasks.dueDate, formatLocalDay(now)),
          ...attachmentClassFilters(owner),
        ),
      );
    return { count: c };
  }

  async create(dto: CreateTaskServiceDto) {
    const task = await this.db.transaction((tx) => this.insertTask(tx, dto));
    await this.notifyNewOwner(task, dto.createdBy);
    return task;
  }

  /**
   * Inserts a Task with its attachments in the caller's transaction. Once it
   * commits, call `notifyNewOwner` (as `create` does).
   */
  async insertTask(
    tx: Pick<DrizzleDatabase, 'insert' | 'delete' | 'select'>,
    dto: CreateTaskServiceDto,
  ): Promise<Task> {
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
    await writeTaskAttachments(tx, created.id, dto, {
      organizationId: dto.organizationId,
      isNew: true,
    });
    return created;
  }

  /** Tells the Task Owner about a Task someone else created for them. */
  async notifyNewOwner(task: Task, createdBy: number): Promise<void> {
    if (task.assignedTo === createdBy) return;
    await this.notificationFactory.ensure({
      recipientUserId: task.assignedTo,
      organizationId: task.organizationId,
      kind: 'assigned',
      taskId: task.id,
    });
  }

  /**
   * The Task with what decides its visibility: its Opportunity and Contact
   * ids and whether it is commercial.
   */
  async findOne(id: number, organizationId: number) {
    const row = await this.db.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)),
      with: {
        taskOpportunities: { columns: { opportunityId: true } },
        taskContacts: { columns: { contactId: true } },
      },
    });
    if (!row) throw new NotFoundException('Not found');
    const { taskOpportunities = [], taskContacts = [], ...task } = row;
    const facts = {
      opportunityIds: taskOpportunities.map((l) => l.opportunityId),
      contactIds: taskContacts.map((l) => l.contactId),
      stayedCommercial: task.stayedCommercial,
    };
    return { ...task, ...facts, commercial: isCommercialTask(facts) };
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
      await writeTaskAttachments(tx, id, dto, {
        organizationId: dto.organizationId,
      });
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
    filters.push(...attachmentClassFilters(params));
    return and(...filters);
  }
}

/** A Date as its local day, `YYYY-MM-DD`. */
export function formatLocalDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
