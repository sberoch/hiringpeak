import { createZodDto } from 'nestjs-zod';
import {
  CreateBlacklistSchema,
  UpdateBlacklistSchema,
  BlacklistQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateBlacklistDto extends createZodDto(CreateBlacklistSchema) {}
export class UpdateBlacklistDto extends createZodDto(UpdateBlacklistSchema) {}
export class BlacklistQueryParams extends createZodDto(
  BlacklistQueryParamsSchema,
) {}
