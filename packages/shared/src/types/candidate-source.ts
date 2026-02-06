import type { PaginationFilters } from "./api.js";

export type BaseCandidateSource = {
  name: string;
};

export type CandidateSource = BaseCandidateSource & {
  id: number;
};

export type CandidateSourceParams = PaginationFilters & {
  name?: string;
};

export type CreateCandidateSourceDto = BaseCandidateSource;
export type UpdateCandidateSourceDto = Partial<BaseCandidateSource>;
