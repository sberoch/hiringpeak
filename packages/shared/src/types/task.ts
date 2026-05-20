import type { PaginationFilters } from "./api.js";
import type { Task } from "../schemas/task.schema.js";
import type { User } from "./user.js";

export type { Task };

export type TaskAttachedCandidate = { id: number; name: string };
export type TaskAttachedVacancy = { id: number; title: string };
export type TaskAttachedCompany = { id: number; name: string };
export type TaskAttachedCandidateVacancy = {
  id: number;
  candidate?: { id: number; name: string } | null;
  vacancy?: { id: number; title: string } | null;
};

export type BaseTask = {
  title: string;
  dueDate?: string | null;
  assignedTo: number;
  candidateId?: number | null;
  vacancyId?: number | null;
  candidateVacancyId?: number | null;
  companyId?: number | null;
};

export type UpdateTaskPayload = {
  title?: string;
  dueDate?: string | null;
  assignedTo?: number;
  candidateId?: number | null;
  vacancyId?: number | null;
  candidateVacancyId?: number | null;
  companyId?: number | null;
};

export type TaskWithRelations = Task & {
  assignedToUser?: User;
  createdByUser?: User;
  candidate?: TaskAttachedCandidate | null;
  vacancy?: TaskAttachedVacancy | null;
  candidateVacancy?: TaskAttachedCandidateVacancy | null;
  company?: TaskAttachedCompany | null;
};

export type TaskFilters = PaginationFilters & {
  assignedTo?: number;
  createdBy?: number;
  completed?: boolean;
  candidateId?: number;
  vacancyId?: number;
  candidateVacancyId?: number;
  companyId?: number;
};

export type TaskParams = TaskFilters;
