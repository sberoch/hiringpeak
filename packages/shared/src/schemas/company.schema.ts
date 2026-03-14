import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { vacancies } from "./vacancy.schema";
import { CompanyStatus } from "../enums";
import { organizations } from "./organization.schema";

export const companyStatusEnum = pgEnum(
  "companyStatus",
  Object.values(CompanyStatus) as [string, ...string[]]
);

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: companyStatusEnum("status").notNull(),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companyRelations = relations(companies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [companies.organizationId],
    references: [organizations.id],
  }),
  vacancies: many(vacancies),
}));

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
