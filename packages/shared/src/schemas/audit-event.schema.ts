import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";

/**
 * Append-only audit log for business-level events (tenant-scoped).
 * Immutable; no updates or deletes.
 */
export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  /** Business action name (e.g. create_user, update_role). */
  eventType: text("event_type").notNull(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "restrict" }),
  /** User who performed the action. */
  actorUserId: integer("actor_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  /** Entity kind (e.g. user, role). */
  entityType: text("entity_type").notNull(),
  /** Target entity id when applicable. */
  entityId: integer("entity_id"),
  /** Optional business context (entity ids, labels, etc.). */
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditEvents.organizationId],
    references: [organizations.id],
  }),
  actorUser: one(users, {
    fields: [auditEvents.actorUserId],
    references: [users.id],
  }),
}));

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
