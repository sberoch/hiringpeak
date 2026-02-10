import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { vacancyStatuses } from "./vacancystatus.schema";
import { companies } from "./company.schema";
import { relations } from "drizzle-orm";
import { vacancyFilters } from "./vacancyfilters.schema";
import { candidateVacancies } from "./candidatevacancy.schema";
import { users } from "./user.schema";
import { organizations } from "./organization.schema";

export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  statusId: integer("status_id").references(() => vacancyStatuses.id, {
    onDelete: "cascade",
  }),
  vacancyFiltersId: integer("vacancy_filters_id").references(
    () => vacancyFilters.id,
    { onDelete: "cascade" }
  ),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  assignedTo: integer("assigned_to")
    .notNull()
    .references(() => users.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vacanciesRelations = relations(vacancies, ({ one, many }) => ({
  status: one(vacancyStatuses, {
    fields: [vacancies.statusId],
    references: [vacancyStatuses.id],
  }),
  filters: one(vacancyFilters, {
    fields: [vacancies.vacancyFiltersId],
    references: [vacancyFilters.id],
  }),
  company: one(companies, {
    fields: [vacancies.companyId],
    references: [companies.id],
  }),
  organization: one(organizations, {
    fields: [vacancies.organizationId],
    references: [organizations.id],
  }),
  candidateVacancies: many(candidateVacancies),
  createdBy: one(users, {
    fields: [vacancies.createdBy],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [vacancies.assignedTo],
    references: [users.id],
  }),
}));

export type Vacancy = typeof vacancies.$inferSelect;
export type NewVacancy = typeof vacancies.$inferInsert;
