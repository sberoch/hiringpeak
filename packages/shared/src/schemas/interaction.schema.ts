import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { InteractionType } from "../enums";
import { companies } from "./company.schema";
import { contacts } from "./contact.schema";
import { opportunities } from "./opportunity.schema";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";

export const interactionTypeEnum = pgEnum(
  "interactionType",
  Object.values(InteractionType) as [string, ...string[]],
);

/**
 * Something that happened with one or more Contacts and/or a Company
 * (commercial side only). `companyId` is the Company *at the time*: stamped on
 * creation and never rewritten when a Contact later moves (ADR 0004).
 */
export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: interactionTypeEnum("type").notNull().$type<InteractionType>(),
    /** The day it happened (`YYYY-MM-DD`). */
    date: date("date").notNull(),
    summary: text("summary").notNull(),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    opportunityId: integer("opportunity_id").references(
      () => opportunities.id,
      { onDelete: "set null" },
    ),
    /** Who recorded it. */
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("interactions_organization_id_idx").on(table.organizationId),
    index("interactions_company_id_idx").on(table.companyId),
    index("interactions_opportunity_id_idx").on(table.opportunityId),
  ],
);

/** The Contacts an Interaction was with. */
export const interactionContacts = pgTable(
  "interaction_contacts",
  {
    interactionId: integer("interaction_id")
      .notNull()
      .references(() => interactions.id, { onDelete: "cascade" }),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.interactionId, table.contactId] }),
    index("interaction_contacts_contact_id_idx").on(table.contactId),
  ],
);

export const interactionsRelations = relations(
  interactions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [interactions.organizationId],
      references: [organizations.id],
    }),
    company: one(companies, {
      fields: [interactions.companyId],
      references: [companies.id],
    }),
    opportunity: one(opportunities, {
      fields: [interactions.opportunityId],
      references: [opportunities.id],
    }),
    createdByUser: one(users, {
      fields: [interactions.createdBy],
      references: [users.id],
    }),
    contacts: many(interactionContacts),
  }),
);

export const interactionContactsRelations = relations(
  interactionContacts,
  ({ one }) => ({
    interaction: one(interactions, {
      fields: [interactionContacts.interactionId],
      references: [interactions.id],
    }),
    contact: one(contacts, {
      fields: [interactionContacts.contactId],
      references: [contacts.id],
    }),
  }),
);

export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
