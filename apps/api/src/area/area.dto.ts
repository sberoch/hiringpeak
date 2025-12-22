import { createZodDto } from 'nestjs-zod';
import {
  CreateAreaSchema,
  UpdateAreaSchema,
  AreaQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateAreaDto extends createZodDto(CreateAreaSchema) {}
export class UpdateAreaDto extends createZodDto(UpdateAreaSchema) {}
export class AreaQueryParams extends createZodDto(AreaQueryParamsSchema) {}
