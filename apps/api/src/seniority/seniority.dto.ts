import { createZodDto } from 'nestjs-zod';
import {
  CreateSenioritySchema,
  UpdateSenioritySchema,
  SeniorityQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateSeniorityDto extends createZodDto(CreateSenioritySchema) {}
export class UpdateSeniorityDto extends createZodDto(UpdateSenioritySchema) {}
export class SeniorityQueryParams extends createZodDto(
  SeniorityQueryParamsSchema,
) {}
