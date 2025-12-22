import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateSourceSchema,
  UpdateCandidateSourceSchema,
  CandidateSourceQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCandidateSourceDto extends createZodDto(
  CreateCandidateSourceSchema,
) {}
export class UpdateCandidateSourceDto extends createZodDto(
  UpdateCandidateSourceSchema,
) {}
export class CandidateSourceQueryParams extends createZodDto(
  CandidateSourceQueryParamsSchema,
) {}
