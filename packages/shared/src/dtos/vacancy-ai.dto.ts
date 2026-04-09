import { z } from "zod";

export const AiVacancyDraftFiltersSchema = z.object({
  seniorityIds: z.array(z.number().int()).optional(),
  areaIds: z.array(z.number().int()).optional(),
  industryIds: z.array(z.number().int()).optional(),
  minStars: z.number().optional(),
  gender: z.string().optional(),
  minAge: z.number().int().optional(),
  maxAge: z.number().int().optional(),
  countries: z.array(z.string()).optional(),
  provinces: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

export const AiVacancyDraftSchema = z.object({
  title: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  salary: z.string().optional().nullable().or(z.literal("")),
  companyId: z.number().int().optional(),
  filters: AiVacancyDraftFiltersSchema,
});

export const ExtractVacancyAiSchema = z.object({
  prompt: z.string().min(1),
});

export const ExtractVacancyAiResponseSchema = z.object({
  token: z.string().min(1),
  draft: AiVacancyDraftSchema,
});

export const CreateAiVacancySchema = z.object({
  token: z.string().min(1),
  draft: AiVacancyDraftSchema,
  companyId: z.number().int(),
  statusId: z.number().int(),
  assignedTo: z.number().int(),
  selectedCandidateIds: z.array(z.number().int()).min(1),
});

export type AiVacancyDraftFiltersDto = z.infer<
  typeof AiVacancyDraftFiltersSchema
>;
export type AiVacancyDraftDto = z.infer<typeof AiVacancyDraftSchema>;
export type ExtractVacancyAiDto = z.infer<typeof ExtractVacancyAiSchema>;
export type ExtractVacancyAiResponseDto = z.infer<
  typeof ExtractVacancyAiResponseSchema
>;
export type CreateAiVacancyDto = z.infer<typeof CreateAiVacancySchema>;

