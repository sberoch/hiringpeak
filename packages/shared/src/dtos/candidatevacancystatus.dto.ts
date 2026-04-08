import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCandidateVacancyStatusSchema = z.object({
  name: z.string().min(1),
  sort: z.number().int().optional(),
  isInitial: z.boolean(),
  isRejection: z.boolean().optional().default(false),
});

export const UpdateCandidateVacancyStatusSchema =
  CreateCandidateVacancyStatusSchema.partial();

export const CandidateVacancyStatusQueryParamsSchema = PaginationParamsSchema;

export type CreateCandidateVacancyStatusDto = z.infer<
  typeof CreateCandidateVacancyStatusSchema
>;
export type UpdateCandidateVacancyStatusDto = z.infer<
  typeof UpdateCandidateVacancyStatusSchema
>;
export type CandidateVacancyStatusQueryParamsDto = z.infer<
  typeof CandidateVacancyStatusQueryParamsSchema
>;
