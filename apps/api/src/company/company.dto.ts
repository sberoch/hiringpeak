import { createZodDto } from 'nestjs-zod';
import {
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyQueryParamsSchema,
  UpdateCompanyAccountOwnerSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateCompanyDto extends createZodDto(CreateCompanySchema) {}
export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
export class UpdateCompanyAccountOwnerDto extends createZodDto(
  UpdateCompanyAccountOwnerSchema,
) {}
export class CompanyQueryParams extends createZodDto(
  CompanyQueryParamsSchema,
) {}

export type CompanyFindAllServiceParams = CompanyQueryParams & {
  organizationId: number;
};

/** Service DTOs: organizationId injected by controller from request context */
export type CreateCompanyServiceDto = CreateCompanyDto & {
  organizationId: number;
};
export type UpdateCompanyServiceDto = UpdateCompanyDto & {
  organizationId: number;
};
