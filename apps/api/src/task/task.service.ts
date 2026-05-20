import {
  BadRequestException,
  Inject,
  Injectable,
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
        'A Task can be attached to at most one of candidate, vacancy, candidacy, or company',
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
        candidateVacancyId: dto.candidateVacancyId ?? null,
        companyId: dto.companyId ?? null,
      } as NewTask)
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
    if (params.candidateVacancyId)
      filters.push(eq(tasks.candidateVacancyId, params.candidateVacancyId));
    if (params.companyId) filters.push(eq(tasks.companyId, params.companyId));
    return and(...filters);
  }
}
