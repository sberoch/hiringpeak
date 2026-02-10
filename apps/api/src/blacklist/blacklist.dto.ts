import { createZodDto } from 'nestjs-zod';
import {
  CreateBlacklistSchema,
  UpdateBlacklistSchema,
  BlacklistQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateBlacklistDto extends createZodDto(CreateBlacklistSchema) {}
export class UpdateBlacklistDto extends createZodDto(UpdateBlacklistSchema) {}
export class BlacklistQueryParams extends createZodDto(
  BlacklistQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateBlacklistServiceDto = CreateBlacklistDto & {
  organizationId: number;
};
export type UpdateBlacklistServiceDto = UpdateBlacklistDto & {
  organizationId: number;
};
