import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCandidateFileSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
});

export const UpdateCandidateFileSchema = CreateCandidateFileSchema.partial();

export const CandidateFileQueryParamsSchema = PaginationParamsSchema;

export type CreateCandidateFileDto = z.infer<typeof CreateCandidateFileSchema>;
export type UpdateCandidateFileDto = z.infer<typeof UpdateCandidateFileSchema>;
export type CandidateFileQueryParamsDto = z.infer<typeof CandidateFileQueryParamsSchema>;

