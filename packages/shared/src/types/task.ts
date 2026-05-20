import type { PaginationFilters } from "./api.js";
import type { Task } from "../schemas/task.schema.js";
import type { User } from "./user.js";

export type { Task };

export type BaseTask = {
  title: string;
  dueDate?: string | null;
  assignedTo: number;
  candidateId?: number | null;
  vacancyId?: number | null;
  candidateVacancyId?: number | null;
  companyId?: number | null;
};

export type TaskWithRelations = Task & {
  assignedToUser?: User;
  createdByUser?: User;
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
