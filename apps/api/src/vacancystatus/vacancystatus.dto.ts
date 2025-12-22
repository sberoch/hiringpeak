import { createZodDto } from 'nestjs-zod';
import {
  CreateVacancyStatusSchema,
  UpdateVacancyStatusSchema,
  VacancyStatusQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateVacancyStatusDto extends createZodDto(
  CreateVacancyStatusSchema,
) {}
export class UpdateVacancyStatusDto extends createZodDto(
  UpdateVacancyStatusSchema,
) {}
export class VacancyStatusQueryParams extends createZodDto(
  VacancyStatusQueryParamsSchema,
) {}
