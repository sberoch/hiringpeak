import type { PaginationFilters } from "./api.js";
import type { Notification } from "../schemas/notification.schema.js";

export type { Notification };

export type NotificationKind = "assigned" | "due" | "overdue";

export type NotificationTaskRef = {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string | null;
};

export type NotificationWithRelations = Notification & {
  task?: NotificationTaskRef | null;
};

export type NotificationFilters = PaginationFilters & {
  unreadOnly?: boolean;
};

export type NotificationParams = NotificationFilters;
