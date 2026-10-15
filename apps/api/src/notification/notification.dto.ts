import { createZodDto } from 'nestjs-zod';
import { NotificationQueryParamsSchema } from '@workspace/shared/dtos';

export class NotificationQueryParams extends createZodDto(
  NotificationQueryParamsSchema,
) {}

export type NotificationFindAllServiceParams = NotificationQueryParams & {
  organizationId: number;
  recipientUserId: number;
  /** Without commercial access, Notifications about commercial Tasks are left out. */
  commercialAccess: boolean;
};
