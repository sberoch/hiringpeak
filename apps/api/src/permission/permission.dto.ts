import { createZodDto } from 'nestjs-zod';
import {
  PermissionQueryParamsSchema,
  UpdatePermissionSchema,
} from '@workspace/shared/dtos';

export class PermissionQueryParams extends createZodDto(
  PermissionQueryParamsSchema,
) {}
export class UpdatePermissionDto extends createZodDto(UpdatePermissionSchema) {}
