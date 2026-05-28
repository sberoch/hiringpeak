import { createZodDto } from 'nestjs-zod';
import {
  CreateRejectionReasonSchema,
  UpdateRejectionReasonSchema,
  RejectionReasonQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateRejectionReasonDto extends createZodDto(
  CreateRejectionReasonSchema,
) {}
export class UpdateRejectionReasonDto extends createZodDto(
  UpdateRejectionReasonSchema,
) {}
export class RejectionReasonQueryParams extends createZodDto(
  RejectionReasonQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller from request context */
export type CreateRejectionReasonServiceDto = CreateRejectionReasonDto & {
  organizationId: number;
};
export type UpdateRejectionReasonServiceDto = UpdateRejectionReasonDto & {
  organizationId: number;
};
export type RejectionReasonFindAllServiceParams = RejectionReasonQueryParams & {
  organizationId: number;
};
