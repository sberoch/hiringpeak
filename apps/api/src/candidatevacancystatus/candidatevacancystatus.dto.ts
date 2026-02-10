import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateVacancyStatusSchema,
  UpdateCandidateVacancyStatusSchema,
  CandidateVacancyStatusQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateCandidateVacancyStatusDto extends createZodDto(
  CreateCandidateVacancyStatusSchema,
) {}
export class UpdateCandidateVacancyStatusDto extends createZodDto(
  UpdateCandidateVacancyStatusSchema,
) {}
export class CandidateVacancyStatusQueryParams extends createZodDto(
  CandidateVacancyStatusQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateCandidateVacancyStatusServiceDto =
  CreateCandidateVacancyStatusDto & { organizationId: number };
export type UpdateCandidateVacancyStatusServiceDto =
  UpdateCandidateVacancyStatusDto & { organizationId: number };
