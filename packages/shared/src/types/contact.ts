import type { PaginationFilters } from "./api.js";

/**
 * A Contact as every Company reader sees it (recruiters included): who the
 * person is and how to reach them.
 */
export type ContactBasic = {
  id: number;
  companyId: number | null;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
};

/** A Contact with the fields shown to commercial users and Contact managers. */
export type Contact = ContactBasic & {
  linkedin: string | null;
};

/** What the Company endpoints return per Contact; `linkedin` only when allowed. */
export type ContactView = ContactBasic & {
  linkedin?: string | null;
};

/** The Vacancy Contact as shown on a Vacancy: name and role only. */
export type VacancyContactSummary = Pick<ContactBasic, "id" | "name" | "role">;

/**
 * A Contact in the commercial network (Contactos page and Contact page,
 * commercial access only): with Company, Contact Source and Contact Owner.
 */
export type NetworkContact = Contact & {
  sourceId: number | null;
  ownerId: number | null;
  shortDescription: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: number; name: string } | null;
  source: { id: number; name: string } | null;
  owner: { id: number; name: string } | null;
};

export type ContactDuplicateReason = "email" | "linkedin" | "name";

/** A probable duplicate of a Contact being created. A warning, never a block. */
export type ContactDuplicate = {
  id: number;
  name: string;
  role: string;
  company: { id: number; name: string } | null;
  reason: ContactDuplicateReason;
};

/** Creating a Contact returns it with its probable duplicates. */
export type CreatedContact = Contact & {
  sourceId: number | null;
  ownerId: number | null;
  shortDescription: string | null;
  duplicates: ContactDuplicate[];
};

export type CreateContactDto = {
  /** Current employer; optional (commercial access needed to leave it empty). */
  companyId?: number | null;
  name: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  sourceId?: number | null;
  /** Absent: defaults to the creator. `null`: "Sin responsable". */
  ownerId?: number | null;
  shortDescription?: string | null;
};

export type UpdateContactDto = Partial<CreateContactDto>;

export type ContactFilters = PaginationFilters & {
  search?: string;
  ownerId?: number | "none";
  sourceId?: number | "none";
  company?: "with" | "without" | number;
};

export type ContactDuplicatesProbe = {
  name?: string;
  email?: string;
  linkedin?: string;
};
