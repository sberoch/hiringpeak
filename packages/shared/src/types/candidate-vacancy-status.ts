import type { PaginationFilters } from "./api.js";

export type BaseCandidateVacancyStatus = {
  name: string;
  sort: number;
  isInitial: boolean;
  isRejection: boolean;
};

export type CandidateVacancyStatus = BaseCandidateVacancyStatus & {
  id: number;
};

export type CandidateVacancyStatusParams =
  PaginationFilters<CandidateVacancyStatus>;
