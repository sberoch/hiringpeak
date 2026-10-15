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

export type OpportunityFilters = {
  search?: string;
  ownerId?: number;
  lostReasonId?: number;
  companyId?: number;
};

export type CreateOpportunityPayload = {
  title: string;
  companyId: number;
  estimatedFee?: number | null;
  ownerId?: number;
};

export type UpdateOpportunityPayload = Partial<CreateOpportunityPayload>;

export type ChangeOpportunityStagePayload = {
  stageId: number;
  lostReasonId?: number | null;
  closeDate?: string | null;
};
