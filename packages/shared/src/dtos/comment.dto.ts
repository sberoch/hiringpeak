import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCommentSchema = z.object({
  candidateId: z.number().int(),
  comment: z.string().min(1),
  userId: z.number().int(),
});

export const UpdateCommentSchema = CreateCommentSchema.partial();

export const DeleteCommentSchema = z.object({
  userId: z.number().int(),
});

export const CommentQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  candidateId: z.coerce.number().optional(),
  comment: z.string().optional(),
  userId: z.coerce.number().optional(),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
export type DeleteCommentDto = z.infer<typeof DeleteCommentSchema>;
export type CommentQueryParamsDto = z.infer<typeof CommentQueryParamsSchema>;

