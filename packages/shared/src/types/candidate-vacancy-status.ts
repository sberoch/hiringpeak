import type { PaginationFilters } from "./api.js";
import { CandidateVacancyState } from "../enums.js";

export type BaseCandidateVacancyStatus = {
  name: string;
  code: CandidateVacancyState | null;
  sort: number;
  isInitial: boolean;
};

export type CandidateVacancyStatus = BaseCandidateVacancyStatus & {
  id: number;
};

export type CandidateVacancyStatusParams =
  PaginationFilters<CandidateVacancyStatus>;
