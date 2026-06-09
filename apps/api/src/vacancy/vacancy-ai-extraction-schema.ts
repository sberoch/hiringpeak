import { z } from 'zod';
import type { AiVacancyDraft } from '@workspace/shared/types/vacancy-ai';

// LLM-facing schema. Unlike AiVacancyDraftSchema (optional-only), every field
// accepts null: models routinely emit null for missing JSON fields, and OpenAI
// non-strict structured output does not enforce omission.
const LLM_FILTERS_SCHEMA = z
  .object({
    seniorityIds: z.array(z.number().int()).nullish(),
    areaIds: z.array(z.number().int()).nullish(),
    industryIds: z.array(z.number().int()).nullish(),
    minStars: z.number().nullish(),
    gender: z.string().nullish(),
    minAge: z.number().int().nullish(),
    maxAge: z.number().int().nullish(),
    countries: z.array(z.string()).nullish(),
    provinces: z.array(z.string()).nullish(),
    languages: z.array(z.string()).nullish(),
  })
  .nullish();

const LLM_DRAFT_SCHEMA = z.object({
  title: z.string().nullish(),
  description: z.string().nullish(),
  salary: z.string().nullish(),
  companyId: z.number().int().nullish(),
  filters: LLM_FILTERS_SCHEMA,
});

export const LLM_EXTRACTION_RESULT_SCHEMA = z.object({
  draft: LLM_DRAFT_SCHEMA,
  metadata: z
    .object({
      inferredFields: z.array(z.string()).nullish(),
      unresolvedSignals: z.array(z.string()).nullish(),
    })
    .nullish(),
});

export type LlmExtractionResult = z.infer<typeof LLM_EXTRACTION_RESULT_SCHEMA>;

export type ExtractionMetadata = {
  inferredFields: string[];
  unresolvedSignals: string[];
};

export function toAiVacancyDraft(
  llmDraft: LlmExtractionResult['draft'],
): AiVacancyDraft {
  const filters = llmDraft.filters ?? {};

  return {
    title: llmDraft.title ?? undefined,
    description: llmDraft.description ?? undefined,
    salary: llmDraft.salary ?? undefined,
    companyId: llmDraft.companyId ?? undefined,
    filters: {
      seniorityIds: filters.seniorityIds ?? undefined,
      areaIds: filters.areaIds ?? undefined,
      industryIds: filters.industryIds ?? undefined,
      minStars: filters.minStars ?? undefined,
      gender: filters.gender ?? undefined,
      minAge: filters.minAge ?? undefined,
      maxAge: filters.maxAge ?? undefined,
      countries: filters.countries ?? undefined,
      provinces: filters.provinces ?? undefined,
      languages: filters.languages ?? undefined,
    },
  };
}

export function toExtractionMetadata(
  metadata: LlmExtractionResult['metadata'],
): ExtractionMetadata {
  return {
    inferredFields: metadata?.inferredFields ?? [],
    unresolvedSignals: metadata?.unresolvedSignals ?? [],
  };
}
