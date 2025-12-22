import { createZodDto } from 'nestjs-zod';
import {
  CreateCommentSchema,
  UpdateCommentSchema,
  DeleteCommentSchema,
  CommentQueryParamsSchema,
} from '@workspace/shared/dtos';

export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}
export class DeleteCommentDto extends createZodDto(DeleteCommentSchema) {}
export class CommentQueryParams extends createZodDto(
  CommentQueryParamsSchema,
) {}
