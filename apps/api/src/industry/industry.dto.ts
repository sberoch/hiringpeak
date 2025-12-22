import { createZodDto } from 'nestjs-zod';
import {
  CreateIndustrySchema,
  UpdateIndustrySchema,
  IndustryQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateIndustryDto extends createZodDto(CreateIndustrySchema) {}
export class UpdateIndustryDto extends createZodDto(UpdateIndustrySchema) {}
export class IndustryQueryParams extends createZodDto(
  IndustryQueryParamsSchema,
) {}
