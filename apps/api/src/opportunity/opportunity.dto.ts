import { createZodDto } from 'nestjs-zod';
import {
  ChangeOpportunityStageSchema,
  CreateOpportunityFromContactSchema,
  CreateOpportunitySchema,
  CreateVacancyFromOpportunitySchema,
  OpportunityQueryParamsSchema,
  UpdateOpportunityCloseDateSchema,
  UpdateOpportunitySchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateOpportunityDto extends createZodDto(
  CreateOpportunitySchema,
) {}
export class CreateOpportunityFromContactDto extends createZodDto(
  CreateOpportunityFromContactSchema,
) {}
export class UpdateOpportunityDto extends createZodDto(
  UpdateOpportunitySchema,
) {}
export class ChangeOpportunityStageDto extends createZodDto(
  ChangeOpportunityStageSchema,
) {}
export class UpdateOpportunityCloseDateDto extends createZodDto(
  UpdateOpportunityCloseDateSchema,
) {}
export class CreateVacancyFromOpportunityDto extends createZodDto(
  CreateVacancyFromOpportunitySchema,
) {}
export class OpportunityQueryParams extends createZodDto(
  OpportunityQueryParamsSchema,
) {}

/** Service DTOs: organizationId (and actor) injected by the controller */
export type CreateOpportunityServiceDto = CreateOpportunityDto & {
  organizationId: number;
  createdBy: number;
};
export type UpdateOpportunityServiceDto = UpdateOpportunityDto & {
  organizationId: number;
};
export type OpportunityFindAllServiceParams = OpportunityQueryParams & {
  organizationId: number;
};
