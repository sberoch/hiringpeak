import { createZodDto } from 'nestjs-zod';
import {
  CreateAreaSchema,
  UpdateAreaSchema,
  AreaQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateAreaDto extends createZodDto(CreateAreaSchema) {}
export class UpdateAreaDto extends createZodDto(UpdateAreaSchema) {}
export class AreaQueryParams extends createZodDto(AreaQueryParamsSchema) {}

/** Service DTOs: organizationId injected by controller */
export type CreateAreaServiceDto = CreateAreaDto & { organizationId: number };
export type UpdateAreaServiceDto = UpdateAreaDto & { organizationId: number };
