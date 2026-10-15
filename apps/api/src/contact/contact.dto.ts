import { createZodDto } from 'nestjs-zod';
import {
  ContactDuplicatesQuerySchema,
  ContactQueryParamsSchema,
  CreateContactSchema,
  UpdateContactSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateContactDto extends createZodDto(CreateContactSchema) {}
export class UpdateContactDto extends createZodDto(UpdateContactSchema) {}
export class ContactQueryParams extends createZodDto(
  ContactQueryParamsSchema,
) {}
export class ContactDuplicatesQuery extends createZodDto(
  ContactDuplicatesQuerySchema,
) {}

/** Who is writing: their Organization, user id and permission codes. */
export type ContactActor = {
  organizationId: number;
  userId: number;
  codes: readonly string[];
};

export type ContactFindAllServiceParams = ContactQueryParams & {
  organizationId: number;
  /** Who is listing; without TASK_READ_ALL they only see their own follow-ups. */
  viewer: { userId: number; readsAllTasks: boolean };
};
