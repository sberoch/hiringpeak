import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { lostReasons } from "./lostreason.schema";
import { opportunityStages } from "./opportunitystage.schema";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";
import { vacancies } from "./vacancy.schema";

export const opportunities = pgTable(
  "opportunities",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => opportunityStages.id),
    /** Opportunity Owner — reassignable; must have commercial access. */
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id),
    /** Hand-entered estimate; null until estimated. Returned as a string by pg. */
    estimatedFee: numeric("estimated_fee", { precision: 14, scale: 2 }),
    /** Present only while in the lost stage. */
    lostReasonId: integer("lost_reason_id").references(() => lostReasons.id),
    /** Opportunity Close Date (day). Present only while in won or lost. */
    closeDate: date("close_date"),
    /** Immutable audit field — no domain meaning. */
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("opportunities_organization_id_idx").on(table.organizationId),
    index("opportunities_company_id_idx").on(table.companyId),
    index("opportunities_stage_id_idx").on(table.stageId),
  ],
);

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [opportunities.organizationId],
    references: [organizations.id],
  }),
  company: one(companies, {
    fields: [opportunities.companyId],
    references: [companies.id],
  }),
  stage: one(opportunityStages, {
    fields: [opportunities.stageId],
    references: [opportunityStages.id],
  }),
  lostReason: one(lostReasons, {
    fields: [opportunities.lostReasonId],
    references: [lostReasons.id],
  }),
  owner: one(users, {
    fields: [opportunities.ownerId],
    references: [users.id],
    relationName: "opportunities_owner",
  }),
  createdByUser: one(users, {
    fields: [opportunities.createdBy],
    references: [users.id],
    relationName: "opportunities_created_by",
  }),
  vacancies: many(vacancies),
}));

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
