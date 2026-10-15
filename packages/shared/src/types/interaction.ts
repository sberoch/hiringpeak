import type { InteractionType } from "../enums.js";

/** A Contact involved in an Interaction, with where they are *now*. */
export type InteractionContact = {
  id: number;
  name: string;
  role: string;
  /** Their current Company; may differ from the Interaction's. */
  companyId: number | null;
  company: { id: number; name: string } | null;
};

/** An Interaction as read on the Opportunity, Company and Contact pages. */
export type Interaction = {
  id: number;
  type: InteractionType;
  /** `YYYY-MM-DD`: the day it happened. */
  date: string;
  summary: string;
  /** The Company *at the time*; never rewritten when a Contact moves. */
  companyId: number | null;
  opportunityId: number | null;
  createdBy: number | null;
  createdAt: string;
  company: { id: number; name: string } | null;
  opportunity: { id: number; title: string } | null;
  createdByUser: { id: number; name: string } | null;
  contacts: InteractionContact[];
};

/** The latest Interaction shown in list columns ("Última interacción"). */
export type LastInteraction = {
  id: number;
  type: InteractionType;
  date: string;
};

export type InteractionFilters = {
  companyId?: number;
  contactId?: number;
  opportunityId?: number;
};

export type CreateInteractionPayload = {
  type: InteractionType;
  date: string;
  summary: string;
  contactIds?: number[];
  /** Absent: defaulted (Opportunity's, else the Contacts' shared Company). */
  companyId?: number | null;
  opportunityId?: number | null;
};

export type UpdateInteractionPayload = {
  type?: InteractionType;
  date?: string;
  summary?: string;
  contactIds?: number[];
};
