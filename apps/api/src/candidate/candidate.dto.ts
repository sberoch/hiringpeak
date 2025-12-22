import { createZodDto } from 'nestjs-zod';
import {
  CreateCandidateSchema,
  UpdateCandidateSchema,
  BlacklistCandidateSchema,
  CandidateQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCandidateDto extends createZodDto(CreateCandidateSchema) {}
export class UpdateCandidateDto extends createZodDto(UpdateCandidateSchema) {}
export class BlacklistCandidateDto extends createZodDto(
  BlacklistCandidateSchema,
) {}
export class CandidateQueryParams extends createZodDto(
  CandidateQueryParamsSchema,
) {}
