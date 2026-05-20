import { createZodDto } from 'nestjs-zod';
import {
  CreateTaskSchema,
  TaskQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId / createdBy. */
export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class TaskQueryParams extends createZodDto(TaskQueryParamsSchema) {}

/** Service DTOs: organizationId + createdBy injected by controller. */
export type CreateTaskServiceDto = CreateTaskDto & {
  organizationId: number;
  createdBy: number;
};
export type TaskFindAllServiceParams = TaskQueryParams & {
  organizationId: number;
};
