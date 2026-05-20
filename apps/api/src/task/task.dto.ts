import { createZodDto } from 'nestjs-zod';
import {
  CreateTaskSchema,
  TaskQueryParamsSchema,
  UpdateTaskSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId / createdBy. */
export class CreateTaskDto extends createZodDto(CreateTaskSchema) {}
export class UpdateTaskDto extends createZodDto(UpdateTaskSchema) {}
export class TaskQueryParams extends createZodDto(TaskQueryParamsSchema) {}

/** Service DTOs: organizationId + createdBy injected by controller. */
export type CreateTaskServiceDto = CreateTaskDto & {
  organizationId: number;
  createdBy: number;
};
export type UpdateTaskServiceDto = UpdateTaskDto & {
  organizationId: number;
  actorUserId: number;
};
export type TaskFindAllServiceParams = TaskQueryParams & {
  organizationId: number;
};
