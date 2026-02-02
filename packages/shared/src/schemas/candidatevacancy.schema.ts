import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { candidates } from "./candidate.schema";
import { vacancies } from "./vacancy.schema";
import { candidateVacancyStatuses } from "./candidatevacancystatus.schema";

export const candidateVacancies = pgTable("candidate_vacancies", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id")
    .references(() => candidates.id, { onDelete: "cascade" })
    .notNull(),
  vacancyId: integer("vacancy_id")
    .references(() => vacancies.id, { onDelete: "cascade" })
    .notNull(),
  candidateVacancyStatusId: integer("candidate_vacancy_status_id")
    .references(() => candidateVacancyStatuses.id, { onDelete: "cascade" })
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidateVacanciesRelations = relations(
  candidateVacancies,
  ({ one }) => ({
    candidate: one(candidates, {
      fields: [candidateVacancies.candidateId],
      references: [candidates.id],
    }),
    vacancy: one(vacancies, {
      fields: [candidateVacancies.vacancyId],
      references: [vacancies.id],
    }),
    candidateVacancyStatus: one(candidateVacancyStatuses, {
      fields: [candidateVacancies.candidateVacancyStatusId],
      references: [candidateVacancyStatuses.id],
    }),
  })
);

export type CandidateVacancy = typeof candidateVacancies.$inferSelect;
export type NewCandidateVacancy = typeof candidateVacancies.$inferInsert;
