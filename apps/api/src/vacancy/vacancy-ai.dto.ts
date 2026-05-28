import { createZodDto } from 'nestjs-zod';
import { CreateAiVacancySchema } from '@workspace/shared/dtos';

export class CreateAiVacancyDto extends createZodDto(CreateAiVacancySchema) {}

import type { VacancyAiUploadFile } from './vacancy-ai-files';

export type ExtractVacancyAiServiceParams = {
  organizationId: number;
  userId: number;
  userPrompt?: string;
  files?: VacancyAiUploadFile[];
};

export type CreateAiVacancyServiceDto = CreateAiVacancyDto & {
  organizationId: number;
  createdBy: number;
};

