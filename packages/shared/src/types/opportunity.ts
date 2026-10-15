import type { LastInteraction } from "./interaction.js";

export type OpportunityStage = {
  id: number;
  name: string;
  sort: number;
  isWon: boolean;
  isLost: boolean;
};

export type LostReason = {
  id: number;
  name: string;
  sort: number;
};

/** A stage as configured in Settings: with how many Opportunities sit in it. */
export type OpportunityStageWithUsage = OpportunityStage & {
  opportunityCount: number;
};

/** A Lost Reason as configured in Settings: with how many Opportunities carry it. */
export type LostReasonWithUsage = LostReason & { opportunityCount: number };

export type OpportunityStageOutcome = "won" | "lost";

/** `sort` is the position among the open stages (or the Lost Reasons), from 0. */
export type CommercialPicklistPayload = { name?: string; sort?: number };

/** A User who can own commercial records (has CRM_READ or CRM_MANAGE). */
export type CommercialUser = {
  id: number;
  name: string;
  email: string;
};

export type Opportunity = {
  id: number;
  title: string;
  companyId: number;
  stageId: number;
  ownerId: number;
  /** Hand-entered estimate; null until estimated. */
  estimatedFee: number | null;
  /** Only while in the lost stage. */
  lostReasonId: number | null;
  /** `YYYY-MM-DD`; only while in the won or lost stage. */
  closeDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  company: { id: number; name: string };
  stage: OpportunityStage;
  owner: { id: number; name: string };
  lostReason: { id: number; name: string } | null;
};

/**
 * A row of `GET /opportunity`. `lastInteraction`: the latest Interaction tied
 * to it, else the latest with its Company.
 */
export type OpportunityListItem = Opportunity & {
  lastInteraction: LastInteraction | null;
};

/** A Vacancy produced by the Opportunity, as listed on its page. */
export type OpportunityVacancy = {
  id: number;
  title: string;
  closedAt: string | null;
  createdAt: string;
  status: { id: number; name: string; isFinal: boolean } | null;
  assignedTo: { id: number; name: string };
  vacancyContact: { id: number; name: string; role: string } | null;
};

/** `GET /opportunity/:id` also lists the Vacancies linked to it. */
export type OpportunityDetail = Opportunity & {
  vacancies: OpportunityVacancy[];
};

export type CreateVacancyFromOpportunityPayload = {
  title: string;
  assignedTo: number;
  vacancyContactId?: number | null;
};

export type OpportunityFilters = {
  search?: string;
  ownerId?: number;
  lostReasonId?: number;
  companyId?: number;
  /** Only the Opportunities this Contact is part of. */
  contactId?: number;
};

export type CreateOpportunityPayload = {
  title: string;
  companyId: number;
  estimatedFee?: number | null;
  ownerId?: number;
};

/**
 * "Crear oportunidad" from a Contact: omit both Company fields when the Contact
 * has a Company; otherwise send `companyId` or `newCompanyName`.
 */
export type CreateOpportunityFromContactPayload = {
  title: string;
  estimatedFee?: number | null;
  ownerId?: number;
  companyId?: number | null;
  newCompanyName?: string | null;
};

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;

export type ChangeOpportunityStagePayload = {
  stageId: number;
  lostReasonId?: number | null;
  closeDate?: string | null;
};
