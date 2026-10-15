import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { contacts } from "./contact.schema";
import { opportunities } from "./opportunity.schema";

/** The Contacts involved in an Opportunity; cascades on both sides. */
export const opportunityContacts = pgTable(
  "opportunity_contacts",
  {
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.opportunityId, t.contactId] }),
    index("opportunity_contacts_contact_id_idx").on(t.contactId),
  ],
);

export const opportunityContactsRelations = relations(
  opportunityContacts,
  ({ one }) => ({
    opportunity: one(opportunities, {
      fields: [opportunityContacts.opportunityId],
      references: [opportunities.id],
    }),
    contact: one(contacts, {
      fields: [opportunityContacts.contactId],
      references: [contacts.id],
    }),
  }),
);

export type OpportunityContact = typeof opportunityContacts.$inferSelect;
