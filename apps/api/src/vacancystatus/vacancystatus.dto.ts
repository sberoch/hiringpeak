import { createZodDto } from 'nestjs-zod';
import {
  CreateVacancyStatusSchema,
  UpdateVacancyStatusSchema,
  VacancyStatusQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTO (controller): no organizationId — client does not send it */
export class CreateVacancyStatusDto extends createZodDto(
  CreateVacancyStatusSchema,
) {}
export class UpdateVacancyStatusDto extends createZodDto(
  UpdateVacancyStatusSchema,
) {}
export class VacancyStatusQueryParams extends createZodDto(
  VacancyStatusQueryParamsSchema,
) {}

/** Service DTOs: organizationId is injected by the controller from request context */
export type CreateVacancyStatusServiceDto = CreateVacancyStatusDto & {
  organizationId: number;
};
export type UpdateVacancyStatusServiceDto = UpdateVacancyStatusDto & {
  organizationId: number;
};
export type VacancyStatusFindAllServiceParams = VacancyStatusQueryParams & {
  organizationId: number;
};
