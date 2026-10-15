import type { PaginationFilters } from "./api.js";
import type { Task } from "../schemas/task.schema.js";
import type { User } from "./user.js";

export type { Task };

export type TaskAttachedCandidate = { id: number; name: string };
export type TaskAttachedVacancy = { id: number; title: string };
export type TaskAttachedCandidacy = {
  id: number;
  candidateName: string;
  vacancyTitle: string;
};
export type TaskAttachedCompany = { id: number; name: string };
export type TaskAttachedContact = { id: number; name: string };
export type TaskAttachedOpportunity = { id: number; title: string };

/** Records a Task is attached to, by type (ADR 0005: any number, any mix). */
export type TaskAttachmentIds = {
  candidateIds?: number[];
  vacancyIds?: number[];
  candidacyIds?: number[];
  companyIds?: number[];
  contactIds?: number[];
  opportunityIds?: number[];
};

/** Tasks page pills: commercial Tasks, or Tasks about recruiting records. */
export type TaskAttachmentClass = "commercial" | "vacancies";

export type BaseTask = {
  title: string;
  dueDate?: string | null;
  assignedTo: number;
} & TaskAttachmentIds;

/** Each attachment list present replaces that type's attachments. */
export type UpdateTaskPayload = {
  title?: string;
  dueDate?: string | null;
  assignedTo?: number;
} & TaskAttachmentIds;

export type TaskWithRelations = Task & {
  assignedToUser?: User;
  createdByUser?: User;
  candidates: TaskAttachedCandidate[];
  vacancies: TaskAttachedVacancy[];
  candidacies: TaskAttachedCandidacy[];
  companies: TaskAttachedCompany[];
  contacts: TaskAttachedContact[];
  opportunities: TaskAttachedOpportunity[];
};

export type TaskFilters = PaginationFilters & {
  assignedTo?: number;
  createdBy?: number;
  completed?: boolean;
  candidateId?: number;
  vacancyId?: number;
  candidacyId?: number;
  companyId?: number;
  contactId?: number;
  opportunityId?: number;
  attachmentClass?: TaskAttachmentClass;
};

export type TaskParams = TaskFilters;
