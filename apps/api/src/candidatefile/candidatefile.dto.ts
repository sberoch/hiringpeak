import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateFileSchema,
  UpdateCandidateFileSchema,
  CandidateFileQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateCandidateFileDto extends createZodDto(
  CreateCandidateFileSchema,
) {}
export class UpdateCandidateFileDto extends createZodDto(
  UpdateCandidateFileSchema,
) {}
export class CandidateFileQueryParams extends createZodDto(
  CandidateFileQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateCandidateFileServiceDto = CreateCandidateFileDto & {
  organizationId: number;
};
export type UpdateCandidateFileServiceDto = UpdateCandidateFileDto & {
  organizationId: number;
};
export type CandidateFileFindAllServiceParams = CandidateFileQueryParams & {
  organizationId: number;
};
