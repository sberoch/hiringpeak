import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateRejectionReasonSchema = z.object({
  name: z.string().min(1),
  sort: z.number().int().optional(),
});

export const UpdateRejectionReasonSchema =
  CreateRejectionReasonSchema.partial();

export const RejectionReasonQueryParamsSchema = PaginationParamsSchema;

export type CreateRejectionReasonDto = z.infer<
  typeof CreateRejectionReasonSchema
>;
export type UpdateRejectionReasonDto = z.infer<
  typeof UpdateRejectionReasonSchema
>;
export type RejectionReasonQueryParamsDto = z.infer<
  typeof RejectionReasonQueryParamsSchema
>;
