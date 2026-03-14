import { createZodDto } from 'nestjs-zod';
import { AuditLogQueryParamsSchema } from '@workspace/shared/dtos';

export class AuditLogQueryParams extends createZodDto(
  AuditLogQueryParamsSchema,
) {}
