import { createZodDto } from 'nestjs-zod';
import {
  CreateAiVacancySchema,
  ExtractVacancyAiSchema,
} from '@workspace/shared/dtos';

export class ExtractVacancyAiDto extends createZodDto(ExtractVacancyAiSchema) {}

export class CreateAiVacancyDto extends createZodDto(CreateAiVacancySchema) {}

export type ExtractVacancyAiServiceParams = ExtractVacancyAiDto & {
  organizationId: number;
  userId: number;
};

export type CreateAiVacancyServiceDto = CreateAiVacancyDto & {
  organizationId: number;
  createdBy: number;
};

