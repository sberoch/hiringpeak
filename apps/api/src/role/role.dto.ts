import { createZodDto } from 'nestjs-zod';
import {
  CreateRoleSchema,
  RoleQueryParamsSchema,
  UpdateRoleSchema,
} from '@workspace/shared/dtos';

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
export class RoleQueryParams extends createZodDto(RoleQueryParamsSchema) {}
