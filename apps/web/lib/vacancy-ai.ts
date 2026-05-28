import type { CandidateParams } from "@workspace/shared/types/candidate";
import type { AiVacancyDraft } from "@workspace/shared/types/vacancy-ai";

export function normalizeAiVacancyDraft(draft: AiVacancyDraft): AiVacancyDraft {
  return {
    ...draft,
    filters: {
      ...draft.filters,
    },
  };
}

export function aiDraftToCandidateParams(draft: AiVacancyDraft): CandidateParams {
  return {
    areaIds: draft.filters.areaIds,
    countries: draft.filters.countries,
    gender: draft.filters.gender,
    industryIds: draft.filters.industryIds,
    languages: draft.filters.languages,
    maximumAge: draft.filters.maxAge,
    minimumAge: draft.filters.minAge,
    minimumStars: draft.filters.minStars,
    provinces: draft.filters.provinces,
    seniorityIds: draft.filters.seniorityIds,
  };
}

