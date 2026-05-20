import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import {
  excludePassword,
  tasks,
  type NewTask,
  type Task,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
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
import { TaskTargetPolicy } from './task-target-policy';

export type TaskApiResponse = Task;

@Injectable()
export class TaskService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

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
        candidate: true,
        vacancy: true,
        company: true,
      },
    });

    const countQuery = this.db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(whereClause);

    let [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    items = items.map((t) => ({
      ...t,
      assignedToUser: excludePassword(t.assignedToUser),
      createdByUser: excludePassword(t.createdByUser),
    }));

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async create(dto: CreateTaskServiceDto) {
    if (!TaskTargetPolicy.isValid(dto)) {
      throw new BadRequestException(
        'A Task can be attached to at most one of candidate, vacancy, or company',
      );
    }

    const [task] = await this.db
      .insert(tasks)
      .values({
        title: dto.title,
        dueDate: dto.dueDate ?? null,
        assignedTo: dto.assignedTo,
        createdBy: dto.createdBy,
        organizationId: dto.organizationId,
        candidateId: dto.candidateId ?? null,
        vacancyId: dto.vacancyId ?? null,
        companyId: dto.companyId ?? null,
      } as NewTask)
      .returning();
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

    const merged = {
      candidateId:
        dto.candidateId !== undefined ? dto.candidateId : existing.candidateId,
      vacancyId:
        dto.vacancyId !== undefined ? dto.vacancyId : existing.vacancyId,
      companyId:
        dto.companyId !== undefined ? dto.companyId : existing.companyId,
    };
    if (!TaskTargetPolicy.isValid(merged)) {
      throw new BadRequestException(
        'A Task can be attached to at most one of candidate, vacancy, or company',
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.dueDate !== undefined) updates.dueDate = dto.dueDate;
    if (dto.assignedTo !== undefined) updates.assignedTo = dto.assignedTo;
    if (dto.candidateId !== undefined) updates.candidateId = dto.candidateId;
    if (dto.vacancyId !== undefined) updates.vacancyId = dto.vacancyId;
    if (dto.companyId !== undefined) updates.companyId = dto.companyId;

    const [task] = await this.db
      .update(tasks)
      .set(updates)
      .where(
        and(eq(tasks.id, id), eq(tasks.organizationId, dto.organizationId)),
      )
      .returning();
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
    if (params.candidateId)
      filters.push(eq(tasks.candidateId, params.candidateId));
    if (params.vacancyId) filters.push(eq(tasks.vacancyId, params.vacancyId));
    if (params.companyId) filters.push(eq(tasks.companyId, params.companyId));
    return and(...filters);
  }
}
