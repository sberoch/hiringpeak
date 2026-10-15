import { createZodDto } from 'nestjs-zod';
import {
  CreateOpportunityStageSchema,
  SetOpportunityStageOutcomeSchema,
  UpdateOpportunityStageSchema,
} from '@workspace/shared/dtos';

export class CreateOpportunityStageDto extends createZodDto(
  CreateOpportunityStageSchema,
) {}
export class UpdateOpportunityStageDto extends createZodDto(
  UpdateOpportunityStageSchema,
) {}
export class SetOpportunityStageOutcomeDto extends createZodDto(
  SetOpportunityStageOutcomeSchema,
) {}
