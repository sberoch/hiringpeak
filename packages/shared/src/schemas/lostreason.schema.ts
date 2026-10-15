import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organization.schema";

/** Per-Organization Lost Reasons ("Motivos de pérdida"). Never emptied. */
export const lostReasons = pgTable("lost_reasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sort: integer("sort").notNull(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
});

export const lostReasonsRelations = relations(lostReasons, ({ one }) => ({
  organization: one(organizations, {
    fields: [lostReasons.organizationId],
    references: [organizations.id],
  }),
}));

export type LostReason = typeof lostReasons.$inferSelect;
export type NewLostReason = typeof lostReasons.$inferInsert;
