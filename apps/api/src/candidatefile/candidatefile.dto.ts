import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateFileSchema,
  UpdateCandidateFileSchema,
  CandidateFileQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCandidateFileDto extends createZodDto(
  CreateCandidateFileSchema,
) {}
export class UpdateCandidateFileDto extends createZodDto(
  UpdateCandidateFileSchema,
) {}
export class CandidateFileQueryParams extends createZodDto(
  CandidateFileQueryParamsSchema,
) {}
