import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateVacancySchema,
  UpdateCandidateVacancySchema,
  CandidateVacancyQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateCandidateVacancyDto extends createZodDto(
  CreateCandidateVacancySchema,
) {}
export class UpdateCandidateVacancyDto extends createZodDto(
  UpdateCandidateVacancySchema,
) {}
export class CandidateVacancyQueryParams extends createZodDto(
  CandidateVacancyQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateCandidateVacancyServiceDto = CreateCandidateVacancyDto & {
  organizationId: number;
};
export type UpdateCandidateVacancyServiceDto = UpdateCandidateVacancyDto & {
  organizationId: number;
};
