import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationParamsSchema } from '@workspace/shared/dtos';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const OrganizationQueryParamsSchema = PaginationParamsSchema.extend({
  name: z.string().optional(),
});

export class CreateOrganizationDto extends createZodDto(
  CreateOrganizationSchema,
) {}
export class OrganizationQueryParams extends createZodDto(
  OrganizationQueryParamsSchema,
) {}
