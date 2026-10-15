import { createZodDto } from 'nestjs-zod';
import {
  CreateContactSchema,
  UpdateContactSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateContactDto extends createZodDto(CreateContactSchema) {}
export class UpdateContactDto extends createZodDto(UpdateContactSchema) {}

/** Service DTOs: organizationId and creator injected by the controller */
export type CreateContactServiceDto = CreateContactDto & {
  organizationId: number;
  createdBy: number;
};
export type UpdateContactServiceDto = UpdateContactDto & {
  organizationId: number;
};
