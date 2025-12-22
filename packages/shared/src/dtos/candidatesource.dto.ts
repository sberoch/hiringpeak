import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCandidateSourceSchema = z.object({
  name: z.string().min(1),
});

export const UpdateCandidateSourceSchema =
  CreateCandidateSourceSchema.partial();

export const CandidateSourceQueryParamsSchema = PaginationParamsSchema;

export type CreateCandidateSourceDto = z.infer<
  typeof CreateCandidateSourceSchema
>;
export type UpdateCandidateSourceDto = z.infer<
  typeof UpdateCandidateSourceSchema
>;
export type CandidateSourceQueryParamsDto = z.infer<
  typeof CandidateSourceQueryParamsSchema
>;
