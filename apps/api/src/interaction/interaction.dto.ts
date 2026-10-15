import { createZodDto } from 'nestjs-zod';
import {
  CreateInteractionSchema,
  InteractionQueryParamsSchema,
  UpdateInteractionSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId — client does not send it */
export class CreateInteractionDto extends createZodDto(
  CreateInteractionSchema,
) {}
export class UpdateInteractionDto extends createZodDto(
  UpdateInteractionSchema,
) {}
export class InteractionQueryParams extends createZodDto(
  InteractionQueryParamsSchema,
) {}

/** Who is writing: their Organization and user id. */
export type InteractionActor = {
  organizationId: number;
  userId: number;
};
