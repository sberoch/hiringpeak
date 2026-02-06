import type { PaginationFilters } from "./api.js";

export type VacancyStatus = {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type VacancyStatusParams = PaginationFilters & {
  name?: string;
};

export type CreateVacancyStatusDto = {
  name: string;
};

export type UpdateVacancyStatusDto = {
  name?: string;
};
