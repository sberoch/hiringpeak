export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AiVacancyDraftFilters = {
  seniorityIds?: number[];
  areaIds?: number[];
  industryIds?: number[];
  minStars?: number;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  countries?: string[];
  provinces?: string[];
  languages?: string[];
};

export type AiVacancyDraft = {
  title?: string;
  description?: string;
  salary?: string | null;
  companyId?: number;
  filters: AiVacancyDraftFilters;
};

export type ExtractVacancyAiResponse = {
  token: string;
  draft: AiVacancyDraft;
};

export type CreateAiVacancyDto = {
  token: string;
  draft: AiVacancyDraft;
  companyId: number;
  statusId: number;
  assignedTo: number;
  selectedCandidateIds: number[];
};

export type VacancyAiRunEventType =
  | "extract_succeeded"
  | "extract_failed"
  | "submitted"
  | "created";
