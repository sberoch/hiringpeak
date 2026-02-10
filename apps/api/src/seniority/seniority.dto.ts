import { createZodDto } from 'nestjs-zod';
import {
  CreateSenioritySchema,
  UpdateSenioritySchema,
  SeniorityQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateSeniorityDto extends createZodDto(CreateSenioritySchema) {}
export class UpdateSeniorityDto extends createZodDto(UpdateSenioritySchema) {}
export class SeniorityQueryParams extends createZodDto(
  SeniorityQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller from request context */
export type CreateSeniorityServiceDto = CreateSeniorityDto & {
  organizationId: number;
};
export type UpdateSeniorityServiceDto = UpdateSeniorityDto & {
  organizationId: number;
};
