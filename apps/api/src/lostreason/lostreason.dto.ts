import { createZodDto } from 'nestjs-zod';
import {
  CreateLostReasonSchema,
  UpdateLostReasonSchema,
} from '@workspace/shared/dtos';

export class CreateLostReasonDto extends createZodDto(CreateLostReasonSchema) {}
export class UpdateLostReasonDto extends createZodDto(UpdateLostReasonSchema) {}
