import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateVacancySchema,
  UpdateCandidateVacancySchema,
  CandidateVacancyQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCandidateVacancyDto extends createZodDto(
  CreateCandidateVacancySchema,
) {}
export class UpdateCandidateVacancyDto extends createZodDto(
  UpdateCandidateVacancySchema,
) {}
export class CandidateVacancyQueryParams extends createZodDto(
  CandidateVacancyQueryParamsSchema,
) {}
