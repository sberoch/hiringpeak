import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { contacts } from "./contact.schema";
import { organizations } from "./organization.schema";

/** Per-Organization picklist for a Contact's "Origen", sortable. */
export const contactSources = pgTable("contact_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sort: integer("sort").notNull(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
});

export const contactSourcesRelations = relations(
  contactSources,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [contactSources.organizationId],
      references: [organizations.id],
    }),
    contacts: many(contacts),
  }),
);

export type ContactSource = typeof contactSources.$inferSelect;
export type NewContactSource = typeof contactSources.$inferInsert;
