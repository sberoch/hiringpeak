import { createZodDto } from 'nestjs-zod';
import {
  VacancyFiltersSchema,
  CreateVacancySchema,
  UpdateVacancySchema,
  VacancyQueryParamsSchema,
} from '@workspace/shared/dtos';

export class VacancyFiltersDto extends createZodDto(VacancyFiltersSchema) {}
export class CreateVacancyDto extends createZodDto(CreateVacancySchema) {}
export class UpdateVacancyDto extends createZodDto(UpdateVacancySchema) {}
export class VacancyQueryParams extends createZodDto(
  VacancyQueryParamsSchema,
) {}
