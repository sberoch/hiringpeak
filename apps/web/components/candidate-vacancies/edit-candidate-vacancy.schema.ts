import { z } from "zod";

export const EditCandidateVacancySchema = z.object({
  candidateId: z.number(),
  vacancyId: z.number(),
  candidateVacancyStatusId: z.number(),
  notes: z.string(),
});

export type EditCandidateVacancySchema = z.infer<
  typeof EditCandidateVacancySchema
>;
