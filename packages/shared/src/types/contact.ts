import type { PaginationFilters } from "./api.js";
import type { InteractionType } from "../enums.js";
import type { LastInteraction } from "./interaction.js";

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

/** The network-only fields of a Contact (commercial access). */
export type ContactNetworkFields = {
  sourceId: number | null;
  ownerId: number | null;
  shortDescription: string | null;
};

/**
 * What a Contact write (create, edit, delete) returns: the Contact as the
 * caller may see it (see contactForViewer), plus the network fields for
 * commercial callers.
 */
export type WrittenContact = ContactView & Partial<ContactNetworkFields>;

/**
 * A Contact in the commercial network (Contactos page and Contact page,
 * commercial access only): with Company, Contact Source and Contact Owner.
 */
export type NetworkContact = Contact &
  ContactNetworkFields & {
    createdAt: string;
    updatedAt: string;
    company: { id: number; name: string } | null;
    source: { id: number; name: string } | null;
    owner: { id: number; name: string } | null;
  };

/** A follow-up: an open Task attached to the Contact. */
export type ContactFollowUp = {
  id: number;
  title: string;
  dueDate: string | null;
  owner: { id: number; name: string };
};

/**
 * A row of the Contactos list, with the Contact's last Interaction and next
 * follow-up (with "Para contactar", the next one owned by the caller).
 */
export type NetworkContactListItem = NetworkContact & {
  lastInteraction: LastInteraction | null;
  nextFollowUp: ContactFollowUp | null;
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
export type CreatedContact = WrittenContact & {
  duplicates: ContactDuplicate[];
};

export type CreateContactDto = {
  /** Current employer; optional (commercial access needed to leave it empty). */
  companyId?: number | null;
  /** Pick or create: a new Company with this name becomes their Company. */
  newCompanyName?: string | null;
  name: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  sourceId?: number | null;
  /** Absent: defaults to the creator. `null`: "Sin responsable". */
  ownerId?: number | null;
  shortDescription?: string | null;
  /** "Abordar en X días": a follow-up Task due today + X, owned by the Contact Owner. */
  followUpInDays?: number | null;
  /** Quick capture: an Interaction with the new Contact, saved with them. */
  firstInteraction?: {
    type: InteractionType;
    /** `YYYY-MM-DD` */
    date: string;
    summary: string;
  } | null;
};

export type UpdateContactDto = Partial<
  Omit<CreateContactDto, "followUpInDays" | "firstInteraction">
>;

export type ContactFilters = PaginationFilters & {
  search?: string;
  ownerId?: number | "none";
  sourceId?: number | "none";
  company?: "with" | "without" | number;
  /** Days: last Interaction older than this (or none). */
  lastInteractionOlderThan?: number;
  /** "Seguimiento: Para contactar": Contacts with an open follow-up owned by me. */
  followUp?: "mine";
};

export type ContactDuplicatesProbe = {
  name?: string;
  email?: string;
  linkedin?: string;
};
