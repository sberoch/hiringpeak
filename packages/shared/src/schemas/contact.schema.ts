import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";
import { vacancies } from "./vacancy.schema";

/**
 * A person the Organization has, or wants, a commercial relationship with.
 * `companyId` is their *current* employer (ADR 0004); it is nulled, never
 * cascaded, when the Company goes, so people survive it.
 */
export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    role: text("role").notNull().default(""),
    email: text("email"),
    phone: text("phone"),
    linkedin: text("linkedin"),
    /** Immutable audit field — null for Contacts created by the data migration. */
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("contacts_organization_id_idx").on(table.organizationId),
    index("contacts_company_id_idx").on(table.companyId),
  ],
);

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  vacancies: many(vacancies),
}));

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
