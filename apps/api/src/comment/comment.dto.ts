import { createZodDto } from 'nestjs-zod';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  DeleteCommentSchema,
  CommentQueryParamsSchema,
} from '@workspace/shared/dtos';

/** Request DTOs (controller): no organizationId */
export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}
export class DeleteCommentDto extends createZodDto(DeleteCommentSchema) {}
export class CommentQueryParams extends createZodDto(
  CommentQueryParamsSchema,
) {}

/** Service DTOs: organizationId injected by controller */
export type CreateCommentServiceDto = CreateCommentDto & {
  organizationId: number;
};
export type UpdateCommentServiceDto = UpdateCommentDto & {
  organizationId: number;
};
