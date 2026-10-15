import { createZodDto } from 'nestjs-zod';
import {
  CreateContactSourceSchema,
  UpdateContactSourceSchema,
  ContactSourceQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateContactSourceDto extends createZodDto(
  CreateContactSourceSchema,
) {}
export class UpdateContactSourceDto extends createZodDto(
  UpdateContactSourceSchema,
) {}
export class ContactSourceQueryParams extends createZodDto(
  ContactSourceQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller from request context */
export type CreateContactSourceServiceDto = CreateContactSourceDto & {
  organizationId: number;
};
export type UpdateContactSourceServiceDto = UpdateContactSourceDto & {
  organizationId: number;
};
export type ContactSourceFindAllServiceParams = ContactSourceQueryParams & {
  organizationId: number;
};
