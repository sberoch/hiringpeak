import type { PaginationFilters } from "./api.js";

export type BaseSeniority = {
  name: string;
};

export type Seniority = BaseSeniority & {
  id: number;
};

export type SeniorityParams = PaginationFilters & {
  name?: string;
};

export type CreateSeniorityDto = BaseSeniority;
export type UpdateSeniorityDto = Partial<BaseSeniority>;
