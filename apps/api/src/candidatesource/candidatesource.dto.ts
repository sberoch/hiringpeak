import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateSourceSchema,
  UpdateCandidateSourceSchema,
  CandidateSourceQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateCandidateSourceDto extends createZodDto(
  CreateCandidateSourceSchema,
) {}
export class UpdateCandidateSourceDto extends createZodDto(
  UpdateCandidateSourceSchema,
) {}
export class CandidateSourceQueryParams extends createZodDto(
  CandidateSourceQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller from request context */
export type CreateCandidateSourceServiceDto = CreateCandidateSourceDto & {
  organizationId: number;
};
export type UpdateCandidateSourceServiceDto = UpdateCandidateSourceDto & {
  organizationId: number;
};
export type CandidateSourceFindAllServiceParams = CandidateSourceQueryParams & {
  organizationId: number;
};
