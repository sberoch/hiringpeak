import { createZodDto } from 'nestjs-zod';
import {
  CreateIndustrySchema,
  UpdateIndustrySchema,
  IndustryQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateIndustryDto extends createZodDto(CreateIndustrySchema) {}
export class UpdateIndustryDto extends createZodDto(UpdateIndustrySchema) {}
export class IndustryQueryParams extends createZodDto(
  IndustryQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller from request context */
export type CreateIndustryServiceDto = CreateIndustryDto & {
  organizationId: number;
};
export type UpdateIndustryServiceDto = UpdateIndustryDto & {
  organizationId: number;
};
