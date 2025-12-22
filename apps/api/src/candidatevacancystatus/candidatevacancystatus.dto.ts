import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateVacancyStatusSchema,
  UpdateCandidateVacancyStatusSchema,
  CandidateVacancyStatusQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCandidateVacancyStatusDto extends createZodDto(
  CreateCandidateVacancyStatusSchema,
) {}
export class UpdateCandidateVacancyStatusDto extends createZodDto(
  UpdateCandidateVacancyStatusSchema,
) {}
export class CandidateVacancyStatusQueryParams extends createZodDto(
  CandidateVacancyStatusQueryParamsSchema,
) {}
