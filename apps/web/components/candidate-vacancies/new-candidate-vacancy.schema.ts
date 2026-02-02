import { z } from "zod";

export const CreateCandidateVacancySchema = z.object({
  candidateId: z.number(),
  vacancyId: z.number(),
  candidateVacancyStatusId: z.number(),
  notes: z.string().optional(),
});

export type CreateCandidateVacancySchema = z.infer<
  typeof CreateCandidateVacancySchema
>;
