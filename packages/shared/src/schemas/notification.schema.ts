import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";
import { tasks } from "./task.schema";
import { users } from "./user.schema";

/**
 * Per-recipient in-app signal.
 * `(taskId, kind, recipientUserId)` dedup is enforced in NotificationFactory,
 * not at the DB level — reassignment to a previously-notified recipient is a
 * legitimate new row, so a unique index would be wrong here.
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientUserId: integer("recipient_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  /** `assigned` for now; `due` and `overdue` reserved for the deadline sweep. */
  kind: text("kind").notNull(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientUserId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
