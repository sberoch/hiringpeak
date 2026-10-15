import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { vacancies } from "./vacancy.schema";
import { contacts } from "./contact.schema";
import { organizations } from "./organization.schema";
import { opportunities } from "./opportunity.schema";
import { users } from "./user.schema";

export const companies = pgTable(
  "companies",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
      }),
    /** The User responsible for the relationship (commercial access only). */
    accountOwnerId: integer("account_owner_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("companies_account_owner_id_idx").on(table.accountOwnerId)],
);

export const companyRelations = relations(companies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [companies.organizationId],
    references: [organizations.id],
  }),
  accountOwner: one(users, {
    fields: [companies.accountOwnerId],
    references: [users.id],
  }),
  vacancies: many(vacancies),
  contacts: many(contacts),
  opportunities: many(opportunities),
}));

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
