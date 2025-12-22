import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const candidateVacancyStatuses = pgTable('candidate_vacancy_statuses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sort: integer('sort').notNull(),
  isInitial: boolean('is_initial').notNull(),
});

export type CandidateVacancyStatus =
  typeof candidateVacancyStatuses.$inferSelect;
export type NewCandidateVacancyStatus =
  typeof candidateVacancyStatuses.$inferInsert;
