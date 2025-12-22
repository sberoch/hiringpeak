import { createZodDto } from 'nestjs-zod';
import {
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCompanyDto extends createZodDto(CreateCompanySchema) {}
export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {}
export class CompanyQueryParams extends createZodDto(CompanyQueryParamsSchema) {}
