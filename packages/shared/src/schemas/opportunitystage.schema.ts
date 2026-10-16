import { boolean, integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organization.schema";

/**
 * Per-Organization Opportunity Stages. Exactly one `isWon` and one `isLost`
 * stage per Organization (enforced in the service), both sorted after every
 * open stage.
 */
export const opportunityStages = pgTable("opportunity_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sort: integer("sort").notNull(),
  isWon: boolean("is_won").notNull().default(false),
  isLost: boolean("is_lost").notNull().default(false),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
});

export const opportunityStagesRelations = relations(
  opportunityStages,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [opportunityStages.organizationId],
      references: [organizations.id],
    }),
  }),
);

export type OpportunityStage = typeof opportunityStages.$inferSelect;
export type NewOpportunityStage = typeof opportunityStages.$inferInsert;
