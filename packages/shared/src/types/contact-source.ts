import type { PaginationFilters } from "./api";

export type ContactSource = {
  id: number;
  name: string;
  sort: number;
};

/** As listed in Settings: with how many Contacts use it. */
export type ContactSourceWithUsage = ContactSource & { contactCount: number };

export type ContactSourceParams = PaginationFilters;

export type CreateContactSourceDto = { name: string; sort?: number };
export type UpdateContactSourceDto = Partial<CreateContactSourceDto>;
