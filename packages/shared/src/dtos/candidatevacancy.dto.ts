import { z } from "zod";
import { PaginationParamsSchema } from "./pagination.dto.js";

export const CreateCandidateVacancySchema = z.object({
  candidateId: z.number().int(),
  vacancyId: z.number().int(),
  candidateVacancyStatusId: z.number().int(),
  notes: z.string().optional(),
  rejectionReason: z.string().nullable().optional(),
});

export const UpdateCandidateVacancySchema =
  CreateCandidateVacancySchema.partial();

export const CandidateVacancyQueryParamsSchema = PaginationParamsSchema.extend({
  id: z.coerce.number().optional(),
  candidateId: z.coerce.number().optional(),
  candidateIds: z
    .union([
      z.array(z.coerce.number()),
      z.coerce.number().transform((v) => [v]),
    ])
    .optional(),
  vacancyId: z.coerce.number().optional(),
  candidateVacancyStatusId: z.coerce.number().optional(),
  notes: z.string().optional(),
  rejectionReason: z.string().nullable().optional(),
});

export type CreateCandidateVacancyDto = z.infer<
  typeof CreateCandidateVacancySchema
>;
export type UpdateCandidateVacancyDto = z.infer<
  typeof UpdateCandidateVacancySchema
>;
export type CandidateVacancyQueryParamsDto = z.infer<
  typeof CandidateVacancyQueryParamsSchema
>;
