import type { PaginationFilters } from "./api.js";

export type VacancyStatus = {
  id: number;
  name: string;
  isFinal: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type VacancyStatusParams = PaginationFilters & {
  name?: string;
};

export type CreateVacancyStatusDto = {
  name: string;
  isFinal?: boolean;
};

export type UpdateVacancyStatusDto = {
  name?: string;
  isFinal?: boolean;
};
