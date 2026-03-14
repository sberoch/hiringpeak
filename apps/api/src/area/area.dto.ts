import { createZodDto } from 'nestjs-zod';
import {
  CreateAreaSchema,
  UpdateAreaSchema,
  AreaQueryParamsSchema,
} from '@workspace/shared/dtos';
import z from 'zod';

/** Request DTOs (controller): organizationId optional for query, injected by decorator */
export class CreateAreaDto extends createZodDto(CreateAreaSchema) {}
export class UpdateAreaDto extends createZodDto(UpdateAreaSchema) {}
export class AreaQueryParamsDto extends createZodDto(
  AreaQueryParamsSchema.extend({
    organizationId: z.coerce.number().optional(),
  }),
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateAreaServiceDto = CreateAreaDto;
export type UpdateAreaServiceDto = UpdateAreaDto;
export type AreaFindAllServiceParams = AreaQueryParamsDto & {
  organizationId: number;
};
