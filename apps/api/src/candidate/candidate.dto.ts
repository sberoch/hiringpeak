import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateSchema,
  UpdateCandidateSchema,
  BlacklistCandidateSchema,
  CandidateQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateCandidateDto extends createZodDto(CreateCandidateSchema) {}
export class UpdateCandidateDto extends createZodDto(UpdateCandidateSchema) {}
export class BlacklistCandidateDto extends createZodDto(
  BlacklistCandidateSchema,
) {}
export class CandidateQueryParams extends createZodDto(
  CandidateQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateCandidateServiceDto = CreateCandidateDto & {
  organizationId: number;
};
export type UpdateCandidateServiceDto = UpdateCandidateDto & {
  organizationId: number;
};
