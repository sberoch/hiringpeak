import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { candidates } from "./candidate.schema";
import { candidateVacancies } from "./candidatevacancy.schema";
import { companies } from "./company.schema";
import { contacts } from "./contact.schema";
import { opportunities } from "./opportunity.schema";
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
  /**
   * Sticky: set when an attached Opportunity or Contact is deleted, so the
   * Task stays commercial (never set by editing the Task's attachments).
   */
  stayedCommercial: boolean("stayed_commercial").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/*
 * Task attachments (ADR 0005): one link table per attachable type. Both FKs
 * cascade, so deleting either side removes only the link — the Task survives
 * the deletion of an attached record (standalone if nothing is left).
 */

const taskIdColumn = () =>
  integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" });

export const taskCandidates = pgTable(
  "task_candidates",
  {
    taskId: taskIdColumn(),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.candidateId] }),
    index("task_candidates_candidate_id_idx").on(t.candidateId),
  ],
);

export const taskVacancies = pgTable(
  "task_vacancies",
  {
    taskId: taskIdColumn(),
    vacancyId: integer("vacancy_id")
      .notNull()
      .references(() => vacancies.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.vacancyId] }),
    index("task_vacancies_vacancy_id_idx").on(t.vacancyId),
  ],
);

export const taskCandidacies = pgTable(
  "task_candidacies",
  {
    taskId: taskIdColumn(),
    candidacyId: integer("candidacy_id")
      .notNull()
      .references(() => candidateVacancies.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.candidacyId] }),
    index("task_candidacies_candidacy_id_idx").on(t.candidacyId),
  ],
);

export const taskCompanies = pgTable(
  "task_companies",
  {
    taskId: taskIdColumn(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.companyId] }),
    index("task_companies_company_id_idx").on(t.companyId),
  ],
);

export const taskContacts = pgTable(
  "task_contacts",
  {
    taskId: taskIdColumn(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.contactId] }),
    index("task_contacts_contact_id_idx").on(t.contactId),
  ],
);

export const taskOpportunities = pgTable(
  "task_opportunities",
  {
    taskId: taskIdColumn(),
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.opportunityId] }),
    index("task_opportunities_opportunity_id_idx").on(t.opportunityId),
  ],
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
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
  taskCandidates: many(taskCandidates),
  taskVacancies: many(taskVacancies),
  taskCandidacies: many(taskCandidacies),
  taskCompanies: many(taskCompanies),
  taskContacts: many(taskContacts),
  taskOpportunities: many(taskOpportunities),
}));

export const taskCandidatesRelations = relations(taskCandidates, ({ one }) => ({
  task: one(tasks, {
    fields: [taskCandidates.taskId],
    references: [tasks.id],
  }),
  candidate: one(candidates, {
    fields: [taskCandidates.candidateId],
    references: [candidates.id],
  }),
}));

export const taskVacanciesRelations = relations(taskVacancies, ({ one }) => ({
  task: one(tasks, {
    fields: [taskVacancies.taskId],
    references: [tasks.id],
  }),
  vacancy: one(vacancies, {
    fields: [taskVacancies.vacancyId],
    references: [vacancies.id],
  }),
}));

export const taskCandidaciesRelations = relations(
  taskCandidacies,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskCandidacies.taskId],
      references: [tasks.id],
    }),
    candidacy: one(candidateVacancies, {
      fields: [taskCandidacies.candidacyId],
      references: [candidateVacancies.id],
    }),
  }),
);

export const taskCompaniesRelations = relations(taskCompanies, ({ one }) => ({
  task: one(tasks, {
    fields: [taskCompanies.taskId],
    references: [tasks.id],
  }),
  company: one(companies, {
    fields: [taskCompanies.companyId],
    references: [companies.id],
  }),
}));

export const taskContactsRelations = relations(taskContacts, ({ one }) => ({
  task: one(tasks, {
    fields: [taskContacts.taskId],
    references: [tasks.id],
  }),
  contact: one(contacts, {
    fields: [taskContacts.contactId],
    references: [contacts.id],
  }),
}));

export const taskOpportunitiesRelations = relations(
  taskOpportunities,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskOpportunities.taskId],
      references: [tasks.id],
    }),
    opportunity: one(opportunities, {
      fields: [taskOpportunities.opportunityId],
      references: [opportunities.id],
    }),
  }),
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
