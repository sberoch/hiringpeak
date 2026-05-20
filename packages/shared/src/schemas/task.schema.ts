import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidate.schema";
import { candidateVacancies } from "./candidatevacancy.schema";
import { companies } from "./company.schema";
import { organizations } from "./organization.schema";
import { users } from "./user.schema";
import { vacancies } from "./vacancy.schema";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  /** Day-granular due date (no time of day). Nullable: backlog items. */
  dueDate: date("due_date"),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  /** Immutable audit field — no domain meaning. */
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  /** Task Owner — reassignable. */
  assignedTo: integer("assigned_to")
    .notNull()
    .references(() => users.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  candidateId: integer("candidate_id").references(() => candidates.id, {
    onDelete: "cascade",
  }),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, {
    onDelete: "cascade",
  }),
  candidateVacancyId: integer("candidate_vacancy_id").references(
    () => candidateVacancies.id,
    { onDelete: "cascade" }
  ),
  companyId: integer("company_id").references(() => companies.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "tasks_created_by",
  }),
  assignedToUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "tasks_assigned_to",
  }),
  completedByUser: one(users, {
    fields: [tasks.completedBy],
    references: [users.id],
    relationName: "tasks_completed_by",
  }),
  candidate: one(candidates, {
    fields: [tasks.candidateId],
    references: [candidates.id],
  }),
  vacancy: one(vacancies, {
    fields: [tasks.vacancyId],
    references: [vacancies.id],
  }),
  candidateVacancy: one(candidateVacancies, {
    fields: [tasks.candidateVacancyId],
    references: [candidateVacancies.id],
  }),
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
