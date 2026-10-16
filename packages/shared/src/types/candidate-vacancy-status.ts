import type { PaginationFilters } from "./api";

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
