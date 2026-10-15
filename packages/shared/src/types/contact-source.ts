import type { PaginationFilters } from "./api.js";

export type ContactSource = {
  id: number;
  name: string;
  sort: number;
};

export type ContactSourceParams = PaginationFilters;

export type CreateContactSourceDto = { name: string; sort?: number };
export type UpdateContactSourceDto = Partial<CreateContactSourceDto>;
