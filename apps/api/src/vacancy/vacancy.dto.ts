import { createZodDto } from 'nestjs-zod';
import {
  VacancyFiltersSchema,
  CreateVacancySchema,
  UpdateVacancySchema,
  CloseVacancySchema,
  ReopenVacancySchema,
  VacancyQueryParamsSchema,
} from '@workspace/shared/dtos';

export class VacancyFiltersDto extends createZodDto(VacancyFiltersSchema) {}
/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateVacancyDto extends createZodDto(CreateVacancySchema) {}
export class UpdateVacancyDto extends createZodDto(UpdateVacancySchema) {}
export class CloseVacancyDto extends createZodDto(CloseVacancySchema) {}
export class ReopenVacancyDto extends createZodDto(ReopenVacancySchema) {}
export class VacancyQueryParams extends createZodDto(
  VacancyQueryParamsSchema,
) {}

/** Service DTOs: organizationId is injected by the controller from request context */
export type CreateVacancyServiceDto = CreateVacancyDto & {
  organizationId: number;
};
export type UpdateVacancyServiceDto = UpdateVacancyDto & {
  organizationId: number;
};
export type CloseVacancyServiceDto = CloseVacancyDto & {
  organizationId: number;
};
export type VacancyFindAllServiceParams = VacancyQueryParams & {
  organizationId: number;
};
